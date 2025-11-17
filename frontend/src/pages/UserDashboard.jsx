import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import "../styles/UserDashboard.css";

const socket = io("http://localhost:4001", {
  transports: ["websocket"],
  reconnection: true,
});

export default function UserDashboard() {
  const [scholarships, setScholarships] = useState([]);
  const navigate = useNavigate();

  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const myId = 1; 
  const receiverId = 2;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.emit("register", { id: myId, role: "user" });

    socket.on("receive_message", (msg) => {
      if (msg.receiverId === myId || msg.senderId === myId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receive_message");
  }, []);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/users/scholarships");
      setScholarships(res.data);
    };
    fetchData();
  }, []);

  const apply = async (scholarship) => {
    if (scholarship.testMode) {
      if (!scholarship.testQuestionId) {
        alert("Error: This scholarship is in test mode but has no question ID.");
        return;
      }
      navigate(`/test/${scholarship.id}/${scholarship.testQuestionId}`);
    } else {
      try {
        await api.post("/users/apply", { scholarshipId: scholarship.id });
        alert("Applied successfully!");
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || "Failed to apply"));
      }
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgData = {
      senderId: myId,
      senderRole: "user",
      receiverId,
      receiverRole: "organization",
      message,
    };
    socket.emit("send_message", msgData);
    setMessage("");
  };

  return (
    <div className="ud-root">
      <h2 className="ud-title">Available Scholarships</h2>

      <div className="ud-grid">
        {scholarships.map((s) => (
          <div key={s.id} className="ud-card">
            <h3 className="ud-card-title">{s.scholarshipName}</h3>
            <p>{s.eligibility}</p>
            <p className="ud-amount">Amount: ₹{s.amount}</p>

            {s.testMode && (
              <p className="ud-test-note">
                Note: This scholarship requires a coding test.
              </p>
            )}

            <button
              onClick={() => apply(s)}
              className="ud-apply-btn"
            >
              {s.testMode ? "Start Test & Apply" : "Apply Now"}
            </button>
          </div>
        ))}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="ud-chat-btn"
        title="Chat with organization"
      >
        💬
      </button>

      {/* Chat Box */}
      {showChat && (
        <div className="ud-chat-box">
          <div className="ud-chat-header">Live Chat (User)</div>

          <div className="ud-chat-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`ud-chat-msg ${
                  m.senderId === myId ? "ud-chat-right" : "ud-chat-left"
                }`}
              >
                {m.message}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          <div className="ud-chat-input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="ud-chat-input"
              placeholder="Type..."
            />
            <button onClick={sendMessage} className="ud-chat-send">
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
