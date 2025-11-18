console.log("--- SERVER.JS IS RESTARTING WITH THE NEW CODE ---");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
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

// ---- Redis connection options (the important part) ----
// BullMQ requires maxRetriesPerRequest = null for blocking ops.
// enableReadyCheck: false helps with containers starting up.
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // If you prefer host/port instead of URL, you can set:
  // host: "127.0.0.1",
  // port: 6379,
};

// Build the client from URL with options merged in:
const connection = new IORedis(REDIS_URL, redisOptions);

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
let questions = [];
try {
  questions = JSON.parse(fs.readFileSync("questions.json", "utf8"));
  console.log(`Loaded ${questions.length} questions.`);
} catch (e) {
  console.error("Failed to load questions.json", e);
  process.exit(1);
}

// ---- API: fetch random question ----
app.get("/api/question", (req, res) => {
  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json({
    id: q.id,
    title: q.title,
    description: q.description,
    boilerplate: q.boilerplate,
  });
});

// ---- API: fetch question BY ID ----
// ---- API: fetch question BY ID ----
app.get("/api/question/:id", (req, res) => {
  const { id } = req.params;
  const question = questions.find((q) => q.id === id);

  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  // Send the FULL question object, including testCases
  res.json(question);
});

app.get("/api/questions", (req, res) => {
  try {
    // 'questions' is the array loaded from questions.json
    const questionList = questions.map(q => ({
      id: q.id,
      title: q.title
    }));
    res.json(questionList);
  } catch (e) {
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// ---- API: submit -> enqueue job ----
app.post("/api/submit", async (req, res) => {
  const { code, language, questionId } = req.body;
  if (!code || !language || !questionId) {
    return res
      .status(400)
      .json({ error: "Missing code, language, or questionId" });
  }

  const job = await codeQueue.add("run-test-cases", { code, language, questionId });
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
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { code, language, questionId } = job.data;
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error("Question not found");
    }

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
  },
  { connection } // <-- make sure Worker also receives the same connection with maxRetriesPerRequest: null
);

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
