// console.log("--- SERVER.JS IS RESTARTING WITH THE NEW CODE (WITH CACHING) ---");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path"); // Import path
const axios = require("axios");
const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// ---- Judge0 (Community) ----
const JUDGE0_URL =
  process.env.JUDGE0_URL ||
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

// ---- Redis connection options ----
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const connection = new IORedis(REDIS_URL, redisOptions);

// --- START OF CACHING MODIFICATION ---
// Use the same connection for caching
const redisCache = connection;
const QUESTIONS_CACHE_KEY = "cache:coding-questions";
// --- END OF CACHING MODIFICATION ---

// ---- Queue wiring ----
const QUEUE_NAME = "code-execution-queue";
const codeQueue = new Queue(QUEUE_NAME, { connection });
const codeQueueEvents = new QueueEvents(QUEUE_NAME, { connection });

codeQueueEvents.on("completed", ({ jobId }) =>
  console.log(`[Queue] Job ${jobId} completed`)
);
codeQueueEvents.on("failed", ({ jobId, failedReason }) =>
  console.error(`[Queue] Job ${jobId} failed: ${failedReason}`)
);

// ---- Load questions ----
const QUESTIONS_FILE_PATH = path.join(__dirname, "questions.json");
let questions = []; // This will be kept in sync by our get/set functions

// --- NEW CACHE-AWARE FUNCTION ---
async function getQuestions() {
  try {
    // 1. Try to get from Redis
    const cachedQuestions = await redisCache.get(QUESTIONS_CACHE_KEY);
    if (cachedQuestions) {
      console.log("[Cache] HIT: Loaded questions from Redis.");
      questions = JSON.parse(cachedQuestions); // Update in-memory
      return questions;
    }
  } catch (e) {
    console.error("Redis GET error:", e);
  }

  // 2. If miss, read from file
  try {
    console.log("[Cache] MISS: Loading questions from file...");
    questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE_PATH, "utf8"));
    console.log(`[Cache] Loaded ${questions.length} questions from file.`);
    
    // 3. Store in Redis for next time
    await redisCache.set(QUESTIONS_CACHE_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error("Failed to load questions.json", e);
    // Don't exit, but log the error
  }
  return questions;
}

// Load questions on startup and populate cache
getQuestions();
// --- END NEW FUNCTION ---


// ---- API: fetch random question ----
// This endpoint is less critical, but we'll make it async just in case
app.get("/api/question", async (req, res) => {
  if (questions.length === 0) await getQuestions(); // Ensure questions are loaded
  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json({
    id: q.id,
    title: q.title,
    description: q.description,
    boilerplate: q.boilerplate,
  });
});

// ---- API: List all question titles/ids (NOW CACHE-AWARE) ----
app.get("/api/questions", async (req, res) => { // Make async
  try {
    const currentQuestions = await getQuestions(); // <-- Use getter
    const questionList = currentQuestions.map((q) => ({
      id: q.id,
      title: q.title,
    }));
    res.json(questionList);
  } catch (e) {
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// ---- API: Add a new question (NOW CACHE-AWARE) ----
app.post("/api/questions", async (req, res) => { // Make async
  try {
    const newQuestion = req.body;

    // Basic validation
    if (
      !newQuestion ||
      !newQuestion.id ||
      !newQuestion.title ||
      !newQuestion.description ||
      !newQuestion.boilerplate ||
      !newQuestion.testCases
    ) {
      return res.status(400).json({ error: "Invalid question JSON format." });
    }

    // Ensure our in-memory list is up to date before checking
    await getQuestions(); 
    
    // Check for duplicate ID
    if (questions.some(q => q.id === newQuestion.id)) {
      return res.status(400).json({ error: `A question with the ID '${newQuestion.id}' already exists. Please use a unique ID.` });
    }

    // Add to in-memory array
    questions.push(newQuestion);

    // --- START OF CACHE INVALIDATION ---
    // 1. Write to Redis (the new source of truth)
    await redisCache.set(QUESTIONS_CACHE_KEY, JSON.stringify(questions));
    
    // 2. Write to file (as a backup/persistence)
    fs.writeFileSync(
      QUESTIONS_FILE_PATH,
      JSON.stringify(questions, null, 2),
      "utf8"
    );
    // --- END OF CACHE INVALIDATION ---
    
    console.log(`[API] Added new question: ${newQuestion.title} (ID: ${newQuestion.id})`);
    
    // Return the newly added question (specifically its ID/Title pair)
    res.status(201).json({ id: newQuestion.id, title: newQuestion.title });

  } catch (e) {
    console.error("[API] Error adding question:", e);
    res.status(500).json({ error: "Failed to save new question. " + e.message });
  }
});


// ---- API: fetch question BY ID (NOW CACHE-AWARE) ----
app.get("/api/question/:id", async (req, res) => { // Make async
  const { id } = req.params;
  const currentQuestions = await getQuestions(); // <-- Use getter
  const question = currentQuestions.find((q) => q.id === id);

  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  // Send the FULL question object, including testCases
  res.json(question);
});


// ---- API: submit -> enqueue job ----
app.post("/api/submit", async (req, res) => {
  const { code, language, questionId } = req.body;
  if (!code || !language || !questionId) {
    return res
      .status(400)
      .json({ error: "Missing code, language, or questionId" });
  }

  const job = await codeQueue.add("run-test-cases", {
    code,
    language,
    questionId,
  });
  res.json({ jobId: job.id });
});

// ---- API: poll job result ----
app.get("/api/result/:jobId", async (req, res) => {
  const job = await codeQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Invalid Job ID" });

  const state = await job.getState();
  res.json({ state, result: job.returnvalue });
});

// ---- Worker: executes Judge0 calls and compares outputs ----
// The worker will use the `questions` array in memory,
// which is kept up-to-date by the `getQuestions` function.
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { code, language, questionId } = job.data;
    
    // Find the question from the in-memory array
    const question = questions.find((q) => q.id === questionId);
    
    if (!question) {
      // If not found, try one more time to fetch from cache/file
      const refreshedQuestions = await getQuestions();
      const refreshedQuestion = refreshedQuestions.find((q) => q.id === questionId);
      if (!refreshedQuestion) {
        throw new Error(`Question not found: ${questionId}`);
      }
      // Use the refreshed question
      return runTestCases(refreshedQuestion, code, language);
    }
    
    // Run tests
    return runTestCases(question, code, language);
  },
  { connection }
);

// --- NEW: Extracted test running logic into its own function ---
async function runTestCases(question, code, language) {
  const tests = [...question.testCases.sample, ...question.testCases.hidden];
  
  const results = {
    sampleResults: [],
    hiddenPassed: 0,
    hiddenTotal: question.testCases.hidden.length,
    compileError: null,
    runtimeError: null,
  };

  for (const t of tests) {
    const run = await runJudge0(code, language, t.input);

    if (run.compileOutput) {
      results.compileError = run.compileOutput;
      break;
    }
    if (run.stderr) {
      results.runtimeError = run.stderr;
      break;
    }

    const actual = (run.stdout || "").trim();
    const expected = (t.expectedOutput || "").trim();
    const passed = actual === expected;

    if (t.isSample) {
      results.sampleResults.push({
        input: t.input,
        actualOutput: actual,
        expectedOutput: expected,
        passed,
      });
    } else if (passed) {
      results.hiddenPassed++;
    }
  }
  return results; // stored as job.returnvalue
}


worker.on("error", (err) => console.error("[Worker] error:", err));
connection.on("error", (err) => console.error("[Redis] error:", err));

// ---- Judge0 helper ----
async function runJudge0(code, language, stdin) {
  const languageMap = { python: 71, java: 62 }; // Python3, Java
  const language_id = languageMap[language];
  if (!language_id) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const resp = await axios.post(
    JUDGE0_URL,
    { source_code: code, language_id, stdin },
    { headers: { "Content-Type": "application/json" } }
  );

  return {
    stdout: resp.data.stdout,
    stderr: resp.data.stderr,
    compileOutput: resp.data.compile_output,
  };
}

// ---- graceful shutdown ----
function shutdown() {
  console.log("Shutting down...");
  Promise.allSettled([
    worker.close().catch(() => {}),
    codeQueue.close().catch(() => {}),
    codeQueueEvents.close().catch(() => {}),
    connection.quit().catch(() => {}),
  ]).finally(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ---- start ----
app.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);