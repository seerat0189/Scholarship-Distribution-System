import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CompanySidebar from "../components/CompanySidebar";

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
    status: "UPCOMING",
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
      const res = await api.post("/companies/create", form);
      alert("Scholarship Posted!");
      setPosted([res.data, ...posted]);
      setStatusMap((m) => ({ ...m, [res.data.id]: res.data.status }));
      setForm({
        scholarshipName: "",
        eligibility: "",
        amount: "",
        minimumCgpa: "",
        testMode: false,
        testQuestionId: questionList.length > 0 ? questionList[0].id : "",
        status: "UPCOMING",
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
        const res = await api.get("/companies/my-scholarships");
        setPosted(res.data);
        // Initialize a local map of statuses for inline editing
        const map = {};
        res.data.forEach((s) => (map[s.id] = s.status));
        setStatusMap(map);
      } catch (error) {
        console.error("Failed to fetch scholarships", error);
      }
    };
    fetchData();
  }, []);

  // Local state to manage inline status selection per scholarship
  const [statusMap, setStatusMap] = useState({});

  const updateStatus = async (id) => {
    const newStatus = statusMap[id];
    try {
      const res = await api.patch(`/companies/scholarships/${id}/status`, {
        status: newStatus,
      });
      // Update posted list
      setPosted((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      alert("Status updated");
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr]">
        <CompanySidebar />
        <main className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Post a New Scholarship</CardTitle>
            <CardDescription>Share a new opportunity with your applicants.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-600">Scholarship Name</label>
                <Input
                  name="scholarshipName"
                  placeholder="Ananya Merit Scholarship"
                  value={form.scholarshipName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-600">Eligibility</label>
                <textarea
                  name="eligibility"
                  placeholder="e.g., Open to science & engineering students with 7.0 CGPA"
                  value={form.eligibility}
                  onChange={handleChange}
                  className="w-full min-h-[70px] resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Amount (₹)</label>
                <Input
                  name="amount"
                  type="number"
                  placeholder="50000"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Minimum CGPA</label>
                <Input
                  name="minimumCgpa"
                  type="number"
                  step="0.1"
                  placeholder="7.5"
                  value={form.minimumCgpa}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="testMode"
                  name="testMode"
                  checked={form.testMode}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="testMode" className="text-sm font-semibold text-slate-600">
                  Enable Coding Test Mode
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {form.testMode && (
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Select Test Question</label>
                  {testServiceError ? (
                    <p className="text-sm text-red-600">Test service unavailable. Ensure coding-test-service is running.</p>
                  ) : (
                    <select
                      name="testQuestionId"
                      id="testQuestionId"
                      value={form.testQuestionId}
                      onChange={handleChange}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" onClick={handleSubmit}>
              Post Scholarship
            </Button>
          </CardFooter>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Your Posted Scholarships</h3>
            <span className="text-sm text-slate-500">{posted.length} active listing(s)</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {posted.map((s) => (
              <Card key={s.id} className="bg-white">
                <CardContent className="space-y-3">
                  <Link
                    to={`/company/applicants/${s.id}`}
                    className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {s.scholarshipName}
                  </Link>
                  <p className="text-sm text-slate-500">₹{s.amount} • {s.minimumCgpa ? `Min CGPA: ${s.minimumCgpa}` : "No min CGPA"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.testMode && (
                      <span className=" rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        Test Mode
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        s.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : s.status === "UPCOMING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <select
                    value={statusMap[s.id] || s.status}
                    onChange={(e) => setStatusMap((m) => ({ ...m, [s.id]: e.target.value }))}
                    className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-sm"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(s.id)}>
                    Update Status
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white shadow-xl transition hover:bg-emerald-500"
        title="Chat with user"
      >
        💬
      </button>

      {showChat && (
        <div className="fixed right-6 bottom-24 max-h-[420px] w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white">
            Live Chat (Organization)
          </div>
          <div className="flex h-48 flex-col gap-2 overflow-y-auto p-4 text-sm text-slate-800">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-white ${
                  m.senderId === myId ? "bg-emerald-500 self-end text-right" : "bg-slate-800 self-start"
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
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
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
