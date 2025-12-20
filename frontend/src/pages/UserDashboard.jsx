import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

// FIX: Point to correct WebSocket port 4001
const socket = io("http://localhost:4001", {
  transports: ["websocket"],
  reconnection: true,
});

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
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
      try {
        const res = await api.get("/users/scholarships");
        setScholarships(res.data);
      } catch (error) {
        console.error("Failed to load scholarships", error);
      }
    };
    fetchData();
  }, []);

  const apply = async (scholarship) => {
    if (scholarship.status !== "ACTIVE") {
      alert(`This scholarship is not open for applications. Status: ${scholarship.status}`);
      return;
    }

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
// fghjsdfnkhdbfhsbg
useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/users/scholarships");
        
        // 🔍 ADD THIS LOG
        console.log("🔥 SCHOLARSHIPS RECEIVED:", res.data); 
        
        setScholarships(res.data);
      } catch (error) {
        // 🔍 THIS WILL TELL YOU IF THE PORT IS WRONG
        console.error("❌ API ERROR:", error); 
      }
    };
    fetchData();
  }, []);
// gdfnlkgbj
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Here’s a quick snapshot of your account.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <h3 className="text-xl font-semibold text-slate-900">{user?.name || user?.email || "Scholar"}</h3>
              <p className="text-sm text-slate-500">{user?.email || "No email available"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {user?.role ?? "Guest"}
              </span>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  View Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Available Scholarships</CardTitle>
            <CardDescription>Filter, review, and apply for the latest opportunities.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {scholarships.map((s) => (
                <Card key={s.id} className="space-y-4">
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{s.scholarshipName}</h3>
                        <p className="text-sm text-slate-500">{s.eligibility}</p>
                        <p className="text-sm text-slate-700">
                          Amount: <span className="font-semibold">₹{s.amount}</span>
                        </p>
                        {/* FIX: Safe navigation for organization name */}
                        <p className="text-sm text-slate-500">
                          from {s.organization?.name || "Unknown Organization"}
                        </p>
                        {s.testMode && <p className="text-sm font-semibold text-indigo-600">Requires coding test</p>}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.status === "UPCOMING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm" onClick={() => apply(s)} disabled={s.status !== "ACTIVE"}>
                        {s.testMode ? "Start Test & Apply" : "Apply Now"}
                      </Button>
                      {s.status !== "ACTIVE" && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {s.status} · Applications paused
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl text-white shadow-xl transition hover:bg-indigo-500"
        title="Chat with organization"
      >
        💬
      </button>

      {showChat && (
        <div className="fixed right-6 bottom-24 max-h-[420px] w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">
            Live Chat (User)
          </div>
          <div className="flex h-48 flex-col gap-2 overflow-y-auto p-4 text-sm text-slate-800">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-white ${
                  m.senderId === myId ? "bg-indigo-500 self-end text-right" : "bg-slate-800 self-start"
                }`}
              >
                {m.message}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
            />
            <Button size="sm" onClick={sendMessage}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}