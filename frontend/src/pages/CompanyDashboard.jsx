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
  const [testServiceError, setTestServiceError] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const myId = 2;
  const receiverId = 1;

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/companies/create", form);
      alert("Scholarship Posted!");
      setPosted([res.data, ...posted]);
      setForm({
        scholarshipName: "",
        eligibility: "",
        amount: "",
        minimumCgpa: "",
        testMode: false,
        testQuestionId: questionList.length > 0 ? questionList[0].id : "",
      });
    } catch (error) {
      alert("Error posting scholarship");
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${TEST_API_URL}/api/questions`);
        if (!response.ok) throw new Error("Test service not responding");
        const data = await response.json();
        setQuestionList(data);

        if (data.length > 0)
          setForm((f) => ({ ...f, testQuestionId: data[0].id }));

        setTestServiceError(false);
      } catch {
        setTestServiceError(true);
      }
    };
    fetchQuestions();
  }, []);

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

        <input
          name="scholarshipName"
          placeholder="Scholarship Name"
          value={form.scholarshipName}
          onChange={handleChange}
          className="cd-input"
          required
        />

        <textarea
          name="eligibility"
          placeholder="Eligibility (e.g., Engineering students)"
          value={form.eligibility}
          onChange={handleChange}
          className="cd-input cd-textarea"
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount (e.g., 50000)"
          value={form.amount}
          onChange={handleChange}
          className="cd-input"
          required
        />

        <input
          name="minimumCgpa"
          type="number"
          step="0.1"
          placeholder="Minimum CGPA (optional)"
          value={form.minimumCgpa}
          onChange={handleChange}
          className="cd-input"
        />

        <div className="cd-checkbox-row">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={form.testMode}
            onChange={handleChange}
            className="cd-checkbox"
          />
          <label htmlFor="testMode" className="cd-label">Enable Coding Test Mode</label>
        </div>

        {form.testMode && (
          <div>
            <label className="cd-label">Select Test Question</label>

            {testServiceError ? (
              <p className="cd-error">⚠ Could not load questions</p>
            ) : (
              <select
                name="testQuestionId"
                value={form.testQuestionId}
                onChange={handleChange}
                className="cd-input"
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
            )}
          </div>
        )}

        <button className="cd-btn-post">Post</button>
      </form>

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

      {/* Chat Button */}
      <button onClick={() => setShowChat(!showChat)} className="cd-chat-btn">💬</button>

      {/* Chat Box */}
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
