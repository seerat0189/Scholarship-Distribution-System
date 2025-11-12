import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";

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

  const myId = 2; // Organization ID (logged-in org)
  const receiverId = 1; // User ID

  // Auto-scroll to last message
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
      const res = await api.post("/company/create", form);
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
      alert(
        "Error posting scholarship: " +
          (error.response?.data?.message || "Server Error")
      );
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
    const fetchData = async () => {
      try {
        const res = await api.get("/company/my-scholarships");
        setPosted(res.data);
      } catch (error) {
        console.error("Failed to fetch scholarships", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 relative">
      <h2 className="text-xl font-bold mb-4">Post New Scholarship</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="scholarshipName"
          placeholder="Scholarship Name"
          value={form.scholarshipName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="eligibility"
          placeholder="Eligibility (e.g., 'Engineering students')"
          value={form.eligibility}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount (e.g., 50000)"
          value={form.amount}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="minimumCgpa"
          type="number"
          step="0.1"
          placeholder="Minimum CGPA (Optional)"
          value={form.minimumCgpa}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={form.testMode}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="testMode" className="font-medium">
            Enable Coding Test Mode
          </label>
        </div>

        {form.testMode && (
          <div>
            <label
              htmlFor="testQuestionId"
              className="block text-sm font-medium text-gray-700"
            >
              Select Test Question
            </label>
            {testServiceError ? (
              <p className="text-red-600">
                Could not load questions. Check coding-test-service.
              </p>
            ) : (
              <select
                name="testQuestionId"
                id="testQuestionId"
                value={form.testQuestionId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                {questionList.length === 0 ? (
                  <option value="">Loading questions...</option>
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

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Post
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-6">Your Posted Scholarships</h3>
      <ul className="mt-3 space-y-2">
        {posted.map((s) => (
          <Link to={`/company/applicants/${s.id}`} key={s.id}>
            <li className="border p-3 rounded hover:bg-gray-100 cursor-pointer">
              {s.scholarshipName} — ₹{s.amount}
              {s.testMode && (
                <span className="ml-2 bg-indigo-200 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                  Test Mode
                </span>
              )}
            </li>
          </Link>
        ))}
      </ul>

      {}
      <button
        onClick={() => setShowChat(!showChat)}
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          backgroundColor: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "55px",
          height: "55px",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
        }}
        title="Chat with user"
      >
        💬
      </button>

      {}
      {showChat && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "25px",
            width: "300px",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              padding: "8px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Live Chat (Organization)
          </div>

          <div
            style={{
              flex: 1,
              height: "200px",
              overflowY: "auto",
              padding: "8px",
              background: "#f9fafb",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  background: m.senderId === myId ? "#1c2b25ff" : "#2f3b53ff",
                  margin: "4px 0",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  textAlign: m.senderId === myId ? "right" : "left",
                }}
              >
                {m.message}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          <div
            style={{
              borderTop: "1px solid #ddd",
              padding: "6px",
              display: "flex",
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type..."
              style={{
                flex: 1,
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "6px",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "5px",
                marginLeft: "5px",
                padding: "6px 10px",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
