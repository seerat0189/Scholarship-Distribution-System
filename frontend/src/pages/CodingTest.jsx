
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios'; // Your main app's API (Port 5000)
import '../styles/CodingTest.css'; // <-- Import the new CSS

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
        setQuestion(data);
        // Set boilerplate only if code is empty (don't overwrite user's work)
        if (code === "") {
          setCode(data.boilerplate[language] || "");
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
        setResults({ error: "Could not load question. Make sure the test service is running and the Question ID is correct." });
      });
  }, [questionId]); // Only run when questionId changes

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
    
    if (!window.confirm(`Are you sure you want to submit? Your final score is ${bestScore}/${question.testCases.hidden.length}.`)) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Submitting your application...");

    try {
      // This is the call to your main backend (Port 5000)
      await api.post("/users/apply", {
        scholarshipId: parseInt(scholarshipId),
        testScore: bestScore, // Submit the user's best score
      });
      alert("Application submitted successfully!");
      navigate("/my-applications"); // Navigate to My Applications page
    } catch (error) {
      setIsLoading(false);
      alert("Error submitting application: " + (error.response?.data?.message || "Failed to apply"));
    }
  };

  return (
    <div className="ct-root">
      <div className="ct-container">
        
        {/* --- Left Panel: Question --- */}
        <div className="ct-question-panel">
          <h1 className="ct-question-title">
            {question ? question.title : "Loading..."}
          </h1>
          <div className="ct-question-description">
            {question ? (
              // Use 'whitespace-pre-wrap' to respect newlines in the description
              <p>{question.description.replace(/\\n/g, '\n')}</p>
            ) : (
              <p>Loading question details...</p>
            )}
          </div>
        </div>

        {/* --- Right Panel: Editor & Output --- */}
        <div className="ct-editor-panel">
          
          {/* Code Editor */}
          <div className="ct-code-box">
            <div className="ct-editor-header">
              <label htmlFor="language-select" className="ct-editor-label">Language:</label>
              <select 
                id="language-select"
                className="ct-language-select"
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
              className="ct-code-textarea"
              spellCheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading || !question}
            />

            <div className="ct-button-group">
              <button
                id="submit-code-btn"
                className="ct-btn ct-btn-run"
                onClick={handleRunCode}
                disabled={isLoading || !question}
              >
                {isLoading ? "Running..." : "Run Code"}
              </button>
              <button
                id="final-submit-btn"
                className="ct-btn ct-btn-submit"
                onClick={handleFinalSubmit}
                disabled={isLoading || bestScore === -1} // Disabled until they run code at least once
              >
                {isLoading ? "Submitting..." : "Final Submit & Apply"}
              </button>
            </div>
            {bestScore !== -1 && (
              <p className="ct-score-info">
                Your best score so far: {bestScore} / {question?.testCases?.hidden?.length || 0}
              </p>
            )}
          </div>

          {/* Output/Results */}
          <div id="output-container" className="ct-results-box">
            <h3 className="ct-results-title">Results</h3>
            
            {isLoading && (
              <div id="loader" className="ct-loader">
                <div className="ct-spinner"></div>
                <p>{loadingMessage}</p>
              </div>
            )}

            {results && !isLoading && (
              <RenderResults results={results} />
            )}

            {!results && !isLoading && (
              <p className="ct-results-placeholder">Run your code to see the results.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component to Display Results ---
function RenderResults({ results }) {
  if (results.error) {
    return (
      <div className="ct-error-box">
        <h4 className="ct-error-title">An Error Occurred</h4>
        <pre className="ct-error-pre">{results.error}</pre>
      </div>
    );
  }

  if (results.compileError) {
    return (
      <div className="ct-error-box">
        <h4 className="ct-error-title">Compilation Error</h4>
        <pre className="ct-error-pre">{results.compileError}</pre>
      </div>
    );
  }
  
  if (results.runtimeError) {
    return (
      <div className="ct-error-box">
        <h4 className="ct-error-title">Runtime Error</h4>
        <pre className="ct-error-pre">{results.runtimeError}</pre>
      </div>
    );
  }

  const allHiddenPassed = results.hiddenPassed === results.hiddenTotal;

  return (
    <div className="ct-results-list">
      {/* Sample Tests */}
      <div>
        <h4 className="ct-results-subtitle">Sample Test Cases</h4>
        <div className="ct-results-list">
          {results.sampleResults && results.sampleResults.map((result, index) => {
            const pass = result.passed;
            return (
              <div key={index} className="ct-test-case">
                <div className={`ct-test-case-header ${pass ? 'pass' : 'fail'}`}>
                  <span>{pass ? '✔' : '✖'}</span>
                  <span>Sample Test {index + 1}: {pass ? 'Passed' : 'Failed'}</span>
                </div>
                {!pass && (
                  <div className="ct-test-case-details">
                    <div><strong>Input:</strong> <pre>{result.input}</pre></div>
                    <div><strong>Your Output:</strong> <pre>{result.actualOutput}</pre></div>
                    <div><strong>Expected:</strong> <pre>{result.expectedOutput}</pre></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden Tests */}
      <div>
        <h4 className="ct-results-subtitle">Hidden Test Cases</h4>
        <div className={`ct-hidden-results ${allHiddenPassed ? 'pass' : 'fail'}`}>
          {allHiddenPassed ? '✔' : '!'}{' '}
          Passed {results.hiddenPassed} out of {results.hiddenTotal} hidden test cases.
        </div>
      </div>
    </div>
  );
}