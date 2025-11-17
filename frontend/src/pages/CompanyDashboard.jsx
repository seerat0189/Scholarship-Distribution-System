
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import "../styles/CompanyDashboard.css";

const TEST_API_URL = "http://localhost:3000";
const socket = io("http://localhost:4001", {
  transports: ["websocket"],
  reconnection: true,
});

// --- Initial States for the new forms ---
const initialQuestionForm = {
  id: "",
  title: "",
  description: "",
  boilerplate_python: "",
  boilerplate_java: "",
};
const initialTestCaseForm = {
  input: "",
  expectedOutput: "",
  isSample: true,
};
// ---

export default function CompanyDashboard() {
  const [form, setForm] = useState({
    scholarshipName: "",
    eligibility: "",
    amount: "",
    minimumCgpa: "",
    testMode: false,
    testQuestionId: "",
  });

  const [posted, setPosted] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  
  // --- NEW STATES for the Question Builder ---
  const [questionMode, setQuestionMode] = useState("select"); // 'select' or 'add'
  const [newQuestionForm, setNewQuestionForm] = useState(initialQuestionForm);
  const [newTestCase, setNewTestCase] = useState(initialTestCaseForm);
  const [addedTestCases, setAddedTestCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  // ---

  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const myId = 2;
  const receiverId = 1;

  // --- Chat functions (unchanged) ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.emit("register", { id: myId, role: "organization" });
    socket.on("receive_message", (msg) => {
      if (msg.receiverId === myId || msg.senderId === myId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => socket.off("receive_message");
  }, []);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgData = {
      senderId: myId,
      senderRole: "organization",
      receiverId,
      receiverRole: "user",
      message,
    };
    socket.emit("send_message", msgData);
    setMessage("");
  };
  // --- End Chat functions ---

  // Handle scholarship form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // --- NEW: Handle question builder form change ---
  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setNewQuestionForm((prev) => ({ ...prev, [name]: value }));
  };
  
  // --- NEW: Handle test case form change ---
  const handleTestCaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTestCase((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- NEW: Add a test case to the list ---
  const handleAddTestCase = () => {
    if (!newTestCase.input || !newTestCase.expectedOutput) {
      alert("Please provide both Input and Expected Output for the test case.");
      return;
    }
    setAddedTestCases((prev) => [...prev, newTestCase]);
    setNewTestCase(initialTestCaseForm); // Reset test case form
  };

  // --- HEAVILY UPDATED SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Submitting..." });

    let questionIdToSubmit = form.testQuestionId;

    // --- Step 1: Add new question if in 'add' mode ---
    if (form.testMode && questionMode === "add") {
      setStatusMessage({ type: "info", text: "Adding new question..." });

      if (addedTestCases.length === 0) {
        setStatusMessage({ type: "error", text: "Please add at least one test case." });
        setIsLoading(false);
        return;
      }

      // --- 1a. Construct the new question JSON from the form state ---
      try {
        const questionId = newQuestionForm.id || 
          (newQuestionForm.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now());

        const newQuestion = {
          id: questionId,
          title: newQuestionForm.title,
          description: newQuestionForm.description.replace(/\n/g, "\\n"), // Escape newlines
          boilerplate: {
            python: newQuestionForm.boilerplate_python,
            java: newQuestionForm.boilerplate_java,
          },
          testCases: {
            sample: addedTestCases.filter(tc => tc.isSample),
            hidden: addedTestCases.filter(tc => !tc.isSample),
          }
        };

        // --- 1b. POST the new question to the coding test service ---
        const res = await fetch(`${TEST_API_URL}/api/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newQuestion),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to add question");
        }

        const addedQuestion = await res.json();
        questionIdToSubmit = addedQuestion.id; // Get the new ID

        // Add to local list and select it
        setQuestionList([addedQuestion, ...questionList]);
        setForm({ ...form, testQuestionId: addedQuestion.id });
        
      } catch (error) {
        setStatusMessage({
          type: "error",
          text: `Error adding question: ${error.message}. Please check all fields.`,
        });
        setIsLoading(false);
        return; // Stop submission
      }
    }

    // --- Step 2: Create the scholarship ---
    setStatusMessage({ type: "info", text: "Posting scholarship..." });
    try {
      const scholarshipData = {
        ...form,
        testQuestionId: form.testMode ? questionIdToSubmit : null, 
      };

      const res = await api.post("/companies/create", scholarshipData);
      
      setStatusMessage({ type: "success", text: "Scholarship Posted!" });
      setPosted([res.data, ...posted]);
      
      // Reset ALL forms
      setForm({
        scholarshipName: "",
        eligibility: "",
        amount: "",
        minimumCgpa: "",
        testMode: false,
        testQuestionId: questionList.length > 0 ? questionList[0].id : "",
      });
      setNewQuestionForm(initialQuestionForm);
      setAddedTestCases([]);
      setNewTestCase(initialTestCaseForm);
      setQuestionMode("select");

    } catch (error) {
      setStatusMessage({
        type: "error",
        text: `Error posting scholarship: ${error.response?.data?.message || error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fetch questions logic (unchanged) ---
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setStatusMessage({ type: "info", text: "Loading questions..." });
        const response = await fetch(`${TEST_API_URL}/api/questions`);
        if (!response.ok) throw new Error("Test service not responding");
        const data = await response.json();
        
        setQuestionList(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, testQuestionId: data[0].id }));
        }
        setStatusMessage({ type: "", text: "" });
      } catch {
        setStatusMessage({
          type: "error",
          text: "⚠ Could not load questions from test service.",
        });
      }
    };
    fetchQuestions();
  }, []);

  // --- Fetch posted scholarships (unchanged) ---
  useEffect(() => {
    const fetchPosted = async () => {
      try {
        const res = await api.get("/companies/my-scholarships");
        setPosted(res.data);
      } catch {
        console.error("Failed to load scholarships");
      }
    };
    fetchPosted();
  }, []);

  return (
    <div className="cd-root">
      <h2 className="cd-title">Post New Scholarship</h2>

      <form onSubmit={handleSubmit} className="cd-form">
        {/* --- Scholarship Details --- */}
        <input
          name="scholarshipName"
          placeholder="Scholarship Name"
          value={form.scholarshipName}
          onChange={handleChange}
          className="cd-input"
          required
          disabled={isLoading}
        />
        <textarea
          name="eligibility"
          placeholder="Eligibility (e.g., Engineering students)"
          value={form.eligibility}
          onChange={handleChange}
          className="cd-input cd-textarea"
          disabled={isLoading}
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount (e.g., 50000)"
          value={form.amount}
          onChange={handleChange}
          className="cd-input"
          required
          disabled={isLoading}
        />
        <input
          name="minimumCgpa"
          type="number"
          step="0.1"
          placeholder="Minimum CGPA (optional)"
          value={form.minimumCgpa}
          onChange={handleChange}
          className="cd-input"
          disabled={isLoading}
        />

        {/* --- Test Mode Checkbox --- */}
        <div className="cd-checkbox-row">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={form.testMode}
            onChange={handleChange}
            className="cd-checkbox"
            disabled={isLoading}
          />
          <label htmlFor="testMode" className="cd-label">
            Enable Coding Test Mode
          </label>
        </div>

        {/* --- TEST MODE UI (SELECT OR ADD) --- */}
        {form.testMode && (
          <div className="cd-test-options">
            {/* --- Toggle Buttons --- */}
            <div className="cd-toggle-group">
              <button
                type="button"
                className={`cd-toggle-btn ${questionMode === 'select' ? 'active' : ''}`}
                onClick={() => setQuestionMode('select')}
                disabled={isLoading}
              >
                Select Existing Question
              </button>
              <button
                type="button"
                className={`cd-toggle-btn ${questionMode === 'add' ? 'active' : ''}`}
                onClick={() => setQuestionMode('add')}
                disabled={isLoading}
              >
                Add New Question
              </button>
            </div>

            {/* --- 1. Select Dropdown --- */}
            {questionMode === 'select' && (
              <div>
                <label className="cd-label">Select Test Question</label>
                {statusMessage.type === 'error' && statusMessage.text.includes('load questions') && (
                  <p className="cd-error">{statusMessage.text}</p>
                )}
                <select
                  name="testQuestionId"
                  value={form.testQuestionId}
                  onChange={handleChange}
                  className="cd-input"
                  disabled={isLoading || questionList.length === 0}
                >
                  {questionList.length === 0 ? (
                    <option>Loading questions...</option>
                  ) : (
                    questionList.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} (ID: {q.id})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* --- 2. Add New Question Form --- */}
            {questionMode === 'add' && (
              <div className="cd-question-builder">
                <h4 className="cd-builder-title">New Question Details</h4>
                <label className="cd-label">Question ID (e.g., "reverse-string")</label>
                <input
                  name="id"
                  placeholder="Unique ID (optional, will be auto-generated)"
                  value={newQuestionForm.id}
                  onChange={handleQuestionFormChange}
                  className="cd-input"
                  disabled={isLoading}
                />
                
                <label className="cd-label">Title</label>
                <input
                  name="title"
                  placeholder="Question Title (e.g., Reverse a String)"
                  value={newQuestionForm.title}
                  onChange={handleQuestionFormChange}
                  className="cd-input"
                  required={questionMode === 'add'}
                  disabled={isLoading}
                />

                <label className="cd-label">Description</label>
                <textarea
                  name="description"
                  placeholder="Full question description..."
                  value={newQuestionForm.description}
                  onChange={handleQuestionFormChange}
                  className="cd-input cd-textarea"
                  required={questionMode === 'add'}
                  disabled={isLoading}
                />

                <label className="cd-label">Python Boilerplate</label>
                <textarea
                  name="boilerplate_python"
                  placeholder="def myFunction(arg):&#10;  # Write code here"
                  value={newQuestionForm.boilerplate_python}
                  onChange={handleQuestionFormChange}
                  className="cd-input cd-textarea cd-code-input"
                  required={questionMode === 'add'}
                  disabled={isLoading}
                />

                <label className="cd-label">Java Boilerplate</label>
                <textarea
                  name="boilerplate_java"
                  placeholder="class Solution {&#10;  public String myFunction(String arg) {&#10;    // Write code here&#10;  }&#10;}"
                  value={newQuestionForm.boilerplate_java}
                  onChange={handleQuestionFormChange}
                  className="cd-input cd-textarea cd-code-input"
                  required={questionMode === 'add'}
                  disabled={isLoading}
                />

                {/* --- Test Case Builder --- */}
                <h4 className="cd-builder-title">Test Cases</h4>
                <div className="cd-test-case-builder">
                  <textarea
                    name="input"
                    placeholder="Test Input"
                    value={newTestCase.input}
                    onChange={handleTestCaseChange}
                    className="cd-input cd-textarea"
                    disabled={isLoading}
                    rows={2}
                  />
                  <textarea
                    name="expectedOutput"
                    placeholder="Expected Output"
                    value={newTestCase.expectedOutput}
                    onChange={handleTestCaseChange}
                    className="cd-input cd-textarea"
                    disabled={isLoading}
                    rows={2}
                  />
                  <div className="cd-checkbox-row">
                    <input
                      type="checkbox"
                      id="isSample"
                      name="isSample"
                      checked={newTestCase.isSample}
                      onChange={handleTestCaseChange}
                      className="cd-checkbox"
                      disabled={isLoading}
                    />
                    <label htmlFor="isSample" className="cd-label">Is this a Sample Test Case? (Visible to user)</label>
                  </div>
                  <button type="button" onClick={handleAddTestCase} className="cd-btn-add-case" disabled={isLoading}>
                    Add Test Case
                  </button>
                </div>
                
                {/* --- List of Added Test Cases --- */}
                <div className="cd-test-case-list">
                  {addedTestCases.map((tc, index) => (
                    <div key={index} className="cd-test-case-item">
                      <strong>{tc.isSample ? "Sample" : "Hidden"} {index + 1}:</strong>
                      <span>Input: {tc.input.length > 20 ? tc.input.substring(0, 20) + "..." : tc.input}</span>
                      <span>Output: {tc.expectedOutput.length > 20 ? tc.expectedOutput.substring(0, 20) + "..." : tc.expectedOutput}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}

        {/* --- STATUS MESSAGE --- */}
        {statusMessage.text && (
          <p className={`cd-message ${statusMessage.type === 'error' ? 'cd-error' : 'cd-success'}`}>
            {statusMessage.text}
          </p>
        )}

        <button className="cd-btn-post" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Post Scholarship"}
        </button>
      </form>

      {/* --- Posted Scholarships List (No changes here) --- */}
      <h3 className="cd-subtitle">Your Posted Scholarships</h3>
      <ul className="cd-sch-list">
        {posted.map((s) => (
          <Link to={`/company/applicants/${s.id}`} key={s.id}>
            <li className="cd-sch-item">
              {s.scholarshipName} — ₹{s.amount}
              {s.testMode && <span className="cd-badge">Test Mode</span>}
            </li>
          </Link>
        ))}
      </ul>

      {/* --- Chat (No changes here) --- */}
      <button onClick={() => setShowChat(!showChat)} className="cd-chat-btn">💬</button>
      {showChat && (
        <div className="cd-chat-box">
          <div className="cd-chat-header">Live Chat (Organization)</div>
          <div className="cd-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cd-chat-msg ${m.senderId === myId ? "cd-right" : "cd-left"}`}>
                {m.message}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>
          <div className="cd-chat-input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type..."
              className="cd-chat-input"
            />
            <button onClick={sendMessage} className="cd-chat-send">➤</button>
          </div>
        </div>
      )}
    </div>
  );
}