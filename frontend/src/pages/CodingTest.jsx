import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios'; 

const TEST_API_URL = import.meta.env.VITE_CODING_TEST_URL || 'http://localhost:3000';

export default function CodingTest() {
  const { scholarshipId, questionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [results, setResults] = useState(null);
  const [bestScore, setBestScore] = useState(-1);

  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setLoadingMessage("Fetching question...");
    
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`${TEST_API_URL}/api/question/${questionId}`);
        if (!res.ok) throw new Error("Question not found");
        const data = await res.json();
        
        setQuestion(data);
        setCode(data.boilerplate["python"] || "");
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
        setResults({ error: "Could not load question. Make sure the test service is running." });
      }
    };

    fetchQuestion();
  }, [questionId]); 

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (question) {
      setCode(question.boilerplate[newLang] || "");
    }
  };

  const pollResult = (jobId) => {
    setLoadingMessage("Running your code...");
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${TEST_API_URL}/api/result/${jobId}`);
        const data = await r.json();

        if (data.state === "completed") {
          clearInterval(intervalRef.current);
          setIsLoading(false);
          setResults(data.result); 
          
          const score = data.result.hiddenPassed || 0;
          if (score > bestScore) {
            setBestScore(score);
          }
        }
      } catch (err) {
        console.error(err);
        clearInterval(intervalRef.current);
        setIsLoading(false);
        setResults({ error: "Failed to poll for results." });
      }
    }, 1000);
  };

  const handleRunCode = async () => {
    if (!question) return;
    setIsLoading(true);
    setLoadingMessage("Submitting your code...");
    setResults(null); 

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

  const handleFinalSubmit = async () => {
    if (bestScore === -1) {
      alert("Please run your code at least once before submitting.");
      return;
    }
    
    // FIX: Calculate total possible score
    const totalPossible = question.testCases.hidden.length;

    if (!window.confirm(`Are you sure you want to submit? Your final score is ${bestScore}/${totalPossible}.`)) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Submitting your application...");

    try {
      // FIX: Send totalScore to backend
      await api.post("/users/apply", {
        scholarshipId: parseInt(scholarshipId),
        testScore: bestScore,
        totalScore: totalPossible, 
      });
      alert("Application submitted successfully!");
      navigate("/user"); 
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
          <div className="lg:w-2/5 bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 id="question-title" className="text-2xl font-semibold text-white mb-4">
              {question ? question.title : "Loading..."}
            </h2>
            <div id="question-description" className="text-gray-300 prose prose-invert">
              {question ? (
                <p className="whitespace-pre-wrap">{question.description.replace(/\\n/g, '\n')}</p>
              ) : (
                <p>Loading question details...</p>
              )}
            </div>
          </div>

          <div className="lg:w-3/5 flex flex-col gap-6">
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
                  disabled={isLoading || bestScore === -1}
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

            <div id="output-container" className="bg-gray-800 p-6 rounded-lg shadow-xl min-h-[150px]">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Results</h3>
              {isLoading && (
                <div id="loader" className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <p className="ml-3">{loadingMessage}</p>
                </div>
              )}
              {results && !isLoading && <RenderResults results={results} />}
              {!results && !isLoading && <p className="text-gray-400">Run your code to see the results.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderResults({ results }) {
  if (results.error || results.compileError || results.runtimeError) {
    return (
      <div>
        <h4 className="text-xl font-semibold text-red-400 mb-2">Error</h4>
        <pre className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap">
          {results.error || results.compileError || results.runtimeError}
        </pre>
      </div>
    );
  }
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-200 mb-2">Sample Test Cases</h4>
      <div className="space-y-4">
        {results.sampleResults?.map((result, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <p className={`font-medium text-lg ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
              Sample Test {index + 1}: {result.passed ? 'Passed' : 'Failed'}
            </p>
          </div>
        ))}
      </div>
      <h4 className="text-lg font-semibold text-gray-200 mt-6 mb-2">Hidden Test Cases</h4>
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className={`text-xl font-bold ${results.hiddenPassed === results.hiddenTotal ? 'text-green-400' : 'text-yellow-400'}`}>
          Passed {results.hiddenPassed} out of {results.hiddenTotal} hidden test cases.
        </p>
      </div>
    </div>
  );
}