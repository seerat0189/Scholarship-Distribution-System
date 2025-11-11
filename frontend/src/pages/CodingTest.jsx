import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios'; // Your main app's API (Port 5000)

// Your SEPARATE coding test server (Port 3000)
const TEST_API_URL = 'http://localhost:3000';

export default function CodingTest() {
  const { scholarshipId, questionId } = useParams();
  const navigate = useNavigate();

  // --- State Variables ---
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [results, setResults] = useState(null);
  const [bestScore, setBestScore] = useState(-1);

  // --- Fetch the CORRECT question ---
  useEffect(() => {
    setIsLoading(true);
    setLoadingMessage("Fetching question...");
    
    fetch(`${TEST_API_URL}/api/question/${questionId}`)
      .then(res => {
        if (!res.ok) throw new Error("Question not found");
        return res.json();
      })
      .then(data => {
        setQuestion(data); // The 'data' object now includes 'testCases'
        setCode(data.boilerplate[language] || "");
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
        setResults({ error: "Could not load question. Make sure the test service is running and the Question ID is correct." });
      });
  }, [questionId]); // Only re-fetch if the questionId changes

  // Update boilerplate in editor when language changes
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (question) {
      setCode(question.boilerplate[newLang] || "");
    }
  };

  // --- Polling for results ---
  const pollResult = (jobId) => {
    setLoadingMessage("Running your code...");
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${TEST_API_URL}/api/result/${jobId}`);
        const data = await r.json();

        if (data.state === "completed") {
          clearInterval(interval);
          setIsLoading(false);
          setResults(data.result); // Show results
          
          // Update the user's best score
          const score = data.result.hiddenPassed || 0;
          if (score > bestScore) {
            setBestScore(score);
          }
        }
      } catch (err) {
        clearInterval(interval);
        setIsLoading(false);
        setResults({ error: "Failed to poll for results." });
      }
    }, 1000);
  };

  // --- "Run Code" Button ---
  const handleRunCode = async () => {
    if (!question) return;
    setIsLoading(true);
    setLoadingMessage("Submitting your code...");
    setResults(null); // Clear old results

    try {
      const response = await fetch(`${TEST_API_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, questionId }),
      });
      const { jobId } = await response.json();
      pollResult(jobId);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setResults({ error: "Failed to submit code." });
    }
  };

  // --- "Final Submit" Button ---
  const handleFinalSubmit = async () => {
    if (bestScore === -1) {
      alert("Please run your code at least once before submitting.");
      return;
    }
    
    // THIS IS THE LINE THAT WAS CRASHING
    // It will now work because `question.testCases` is loaded
    if (!window.confirm(`Are you sure you want to submit? Your final score is ${bestScore}/${question.testCases.hidden.length}.`)) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Submitting your application...");

    try {
      // This is the call to your main backend (Port 5000)
      await api.post("/user/apply", {
        scholarshipId: parseInt(scholarshipId),
        testScore: bestScore, // Submit the user's best score
      });
      alert("Application submitted successfully!");
      navigate("/user"); // Now we exit
    } catch (error) {
      setIsLoading(false);
      alert("Error submitting application: " + (error.response?.data?.message || "Failed to apply"));
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 font-sans p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-400">Coding Test</h1>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* --- Left Panel: Question --- */}
          <div className="lg:w-2/5 bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 id="question-title" className="text-2xl font-semibold text-white mb-4">
              {question ? question.title : "Loading..."}
            </h2>
            <div id="question-description" className="text-gray-300 prose prose-invert">
              {question ? (
                // Use 'whitespace-pre-wrap' to respect newlines in the description
                <p className="whitespace-pre-wrap">{question.description.replace(/\\n/g, '\n')}</p>
              ) : (
                <p>Loading question details...</p>
              )}
            </div>
          </div>

          {/* --- Right Panel: Editor & Output --- */}
          <div className="lg:w-3/S5 flex flex-col gap-6">
            {/* Code Editor */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <label htmlFor="language-select" className="text-lg font-medium">Language:</label>
                <select 
                  id="language-select"
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
                  value={language}
                  onChange={handleLanguageChange}
                  disabled={isLoading}
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <textarea
                id="code-editor"
                className="w-full p-4 rounded-lg font-mono bg-[#1e1e1e] text-[#d4d4d4] border border-gray-600 min-h-[400px]"
                spellCheck="false"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading || !question}
              />

              <div className="flex gap-4 mt-4">
                <button
                  id="submit-code-btn"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                  onClick={handleRunCode}
                  disabled={isLoading || !question}
                >
                  Run Code
                </button>
                <button
                  id="final-submit-btn"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                  onClick={handleFinalSubmit}
                  disabled={isLoading || bestScore === -1} // Disabled until they run code at least once
                >
                  Final Submit & Apply
                </button>
              </div>
              {bestScore !== -1 && (
                <p className="text-center text-yellow-400 mt-2">
                  Your best score so far: {bestScore} / {question?.testCases?.hidden?.length || 0}
                </p>
              )}
            </div>

            {/* Output/Results */}
            <div id="output-container" className="bg-gray-800 p-6 rounded-lg shadow-xl min-h-[150px]">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Results</h3>
              
              {isLoading && (
                <div id="loader" className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <p className="ml-3">{loadingMessage}</p>
                </div>
              )}

              {results && !isLoading && (
                <RenderResults results={results} />
              )}

              {!results && !isLoading && (
                <p className="text-gray-400">Run your code to see the results.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component to Display Results ---
// --- Helper Component to Display Results ---
function RenderResults({ results }) {
  if (results.error) {
    return (
      <div>
        <h4 className="text-xl font-semibold text-red-400 mb-2">An Error Occurred</h4>
        <pre className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap">{results.error}</pre>
      </div>
    );
  }

  if (results.compileError) {
    return (
      <div>
        <h4 className="text-xl font-semibold text-red-400 mb-2">Compilation Error</h4>
        <pre className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap">{results.compileError}</pre>
      </div>
    );
  }
  
  if (results.runtimeError) {
    return (
      <div>
        <h4 className="text-xl font-semibold text-red-400 mb-2">Runtime Error</h4>
        <pre className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap">{results.runtimeError}</pre>
      </div>
    );
  }

  return (
    <div>
      {/* Sample Tests */}
      <h4 className="text-lg font-semibold text-gray-200 mb-2">Sample Test Cases</h4>
      <div className="space-y-4">
        {results.sampleResults && results.sampleResults.map((result, index) => {
          const pass = result.passed;
          return (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <p className={`font-medium text-lg ${pass ? 'text-green-400' : 'text-red-400'}`}>
                Sample Test {index + 1}: {pass ? 'Passed' : 'Failed'}
              </p>
              <div className="mt-2 text-sm text-gray-300 space-y-1">
                <p><span className="font-semibold text-gray-400">Input:</span> <code className="bg-gray-900 px-1 rounded">{result.input}</code></p>
                <p><span className="font-semibold text-gray-400">Your Output:</span> <code className="bg-gray-900 px-1 rounded">{result.actualOutput}</code></p>
                <p><span className="font-semibold text-gray-400">Expected:</span> <code className="bg-gray-900 px-1 rounded">{result.expectedOutput}</code></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden Tests */}
      <h4 className="text-lg font-semibold text-gray-200 mt-6 mb-2">Hidden Test Cases</h4>
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className={`text-xl font-bold ${results.hiddenPassed === results.hiddenTotal ? 'text-green-400' : 'text-yellow-400'}`}>
          Passed {results.hiddenPassed} out of {results.hiddenTotal} hidden test cases.
        </p> {/* <-- THIS IS THE CORRECTED LINE */}
      </div>
    </div>
  );
}