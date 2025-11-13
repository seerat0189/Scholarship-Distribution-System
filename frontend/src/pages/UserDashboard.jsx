import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";

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

  const myId = 1; // logged-in user ID
  const receiverId = 2; // target organization ID

  // Scroll to latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Register user in WebSocket
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
        alert(
          "Error: This scholarship is in test mode but has no question ID."
        );
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
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-4">Available Scholarships</h2>

      <div className="grid gap-4">
        {scholarships.map((s) => (
          <div key={s.id} className="border p-4 rounded shadow">
            <h3 className="font-semibold">{s.scholarshipName}</h3>
            <p>{s.eligibility}</p>
            <p>Amount: ₹{s.amount}</p>
            {s.testMode && (
              <p className="text-indigo-600 font-medium">
                Note: This scholarship requires a coding test.
              </p>
            )}
            <button
              onClick={() => apply(s)}
              className="bg-indigo-600 text-white px-3 py-1 rounded mt-2"
            >
              {s.testMode ? "Start Test & Apply" : "Apply Now"}
            </button>
          </div>
        ))}
      </div>

      {}
      <button
        onClick={() => setShowChat(!showChat)}
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          backgroundColor: "#4f46e5",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "55px",
          height: "55px",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
        }}
        title="Chat with organization"
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
              backgroundColor: "#4f46e5",
              color: "white",
              padding: "8px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Live Chat (User)
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
                border: "1px solid #0f0b0bff",
                borderRadius: "5px",
                padding: "6px",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#4f46e5",
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
