import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
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

// Reverted to 4001
const socket = io("http://localhost:4001", {
  transports: ["websocket"],
  reconnection: true,
});

const initialQuestionForm = {
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

export default function CompanyDashboard() {
  const { user } = useContext(AuthContext);

  // --- UI STATES (Original) ---
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
  const [isLoading, setIsLoading] = useState(false);
  const [statusMap, setStatusMap] = useState({});

  const [questionMode, setQuestionMode] = useState("select");
  const [newQuestionForm, setNewQuestionForm] = useState(initialQuestionForm);
  const [newTestCase, setNewTestCase] = useState(initialTestCaseForm);
  const [addedTestCases, setAddedTestCases] = useState([]);

  // --- CHAT & PRESENCE STATE (New) ---
  const [showChat, setShowChat] = useState(false);
  const [contacts, setContacts] = useState([]); // List of Applicants (Users)
  const [activeContact, setActiveContact] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // IDs of online users
  const chatEndRef = useRef(null);

  // 1. Register & Presence
  useEffect(() => {
    if (user?.id) {
      socket.emit("register", { id: user.id, role: "organization" });
    }

    // Initial Online List
    socket.on("online_users_list", (ids) => {
      setOnlineUsers(new Set(ids));
    });

    // Real-time Presence Updates
    socket.on("user_status", ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    });

    // Chat
    socket.on("receive_message", (msg) => {
      if (activeContact && msg.senderRole === "user" && msg.senderId === activeContact.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("online_users_list");
      socket.off("user_status");
      socket.off("receive_message");
    };
  }, [user, activeContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  // 2. Fetch Data
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

    const fetchData = async () => {
      try {
        const res = await api.get("/companies/my-scholarships");
        setPosted(res.data);
        const map = {};
        res.data.forEach((s) => (map[s.id] = s.status));
        setStatusMap(map);

        // Fetch contacts (Applicants)
        const contactsRes = await api.get("/chat/contacts");
        setContacts(contactsRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  // 3. Load History
  useEffect(() => {
    if (!activeContact) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${activeContact.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [activeContact]);

  const sendMessage = () => {
    if (!message.trim() || !activeContact) return;
    const msgData = {
      senderId: user.id,
      senderRole: "organization",
      receiverId: activeContact.id,
      receiverRole: "user",
      message,
    };
    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, { ...msgData, sender: "ORGANIZATION" }]);
    setMessage("");
  };

  // --- FORM HANDLERS (Reverted to Original) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const updateStatus = async (id) => {
    const newStatus = statusMap[id];
    try {
      const res = await api.patch(`/companies/scholarships/${id}/status`, {
        status: newStatus,
      });
      setPosted((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      alert("Status updated");
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setNewQuestionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestCaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTestCase((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddTestCase = () => {
    if (!newTestCase.input || !newTestCase.expectedOutput) {
      alert("Please provide both Input and Expected Output.");
      return;
    }
    setAddedTestCases((prev) => [...prev, newTestCase]);
    setNewTestCase(initialTestCaseForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let finalQuestionId = form.testQuestionId;

    try {
      if (form.testMode && questionMode === "add") {
        if (addedTestCases.length === 0) {
          throw new Error("Please add at least one test case.");
        }

        const questionId = newQuestionForm.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
        
        const newQuestionPayload = {
          id: questionId,
          title: newQuestionForm.title,
          description: newQuestionForm.description,
          boilerplate: {
            python: newQuestionForm.boilerplate_python,
            java: newQuestionForm.boilerplate_java,
          },
          testCases: {
            sample: addedTestCases.filter(tc => tc.isSample),
            hidden: addedTestCases.filter(tc => !tc.isSample),
          }
        };

        const qRes = await fetch(`${TEST_API_URL}/api/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newQuestionPayload),
        });

        if (!qRes.ok) throw new Error("Failed to save new question.");
        
        const addedQuestion = await qRes.json();
        setQuestionList((prev) => [addedQuestion, ...prev]);
        finalQuestionId = addedQuestion.id; 
      }

      const scholarshipPayload = {
        ...form,
        testQuestionId: form.testMode ? finalQuestionId : null,
      };

      const res = await api.post("/companies/create", scholarshipPayload);
      
      alert("Scholarship Posted Successfully!");
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
      setNewQuestionForm(initialQuestionForm);
      setAddedTestCases([]);
      setQuestionMode("select");

    } catch (error) {
      alert("Error: " + (error.message || error.response?.data?.message || "Server Error"));
    } finally {
      setIsLoading(false);
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
                  <Input name="scholarshipName" placeholder="Ananya Merit Scholarship" value={form.scholarshipName} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Eligibility</label>
                  <textarea
                    name="eligibility"
                    placeholder="e.g., Open to science & engineering students..."
                    value={form.eligibility}
                    onChange={handleChange}
                    className="w-full min-h-[70px] resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Amount (₹)</label>
                  <Input name="amount" type="number" placeholder="50000" value={form.amount} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Minimum CGPA</label>
                  <Input name="minimumCgpa" type="number" step="0.1" placeholder="7.5" value={form.minimumCgpa} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    disabled={isLoading}
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="testMode"
                    name="testMode"
                    checked={form.testMode}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <label htmlFor="testMode" className="text-sm font-semibold text-slate-600">
                    Enable Coding Test Mode
                  </label>
                </div>
                {form.testMode && (
                  <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={questionMode === "select" ? "default" : "outline"}
                        onClick={() => setQuestionMode("select")}
                        size="sm"
                        disabled={isLoading}
                      >
                        Select Existing
                      </Button>
                      <Button
                        type="button"
                        variant={questionMode === "add" ? "default" : "outline"}
                        onClick={() => setQuestionMode("add")}
                        size="sm"
                        disabled={isLoading}
                      >
                        Create New Question
                      </Button>
                    </div>
                    {questionMode === "select" && (
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600">Choose Question</label>
                        {testServiceError ? (
                          <p className="text-sm text-red-600">Test service unavailable.</p>
                        ) : (
                          <select
                            name="testQuestionId"
                            value={form.testQuestionId}
                            onChange={handleChange}
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                            disabled={isLoading}
                          >
                            {questionList.length === 0 ? <option value="">Loading...</option> : 
                              questionList.map(q => <option key={q.id} value={q.id}>{q.title} (ID: {q.id})</option>)
                            }
                          </select>
                        )}
                      </div>
                    )}
                    {questionMode === "add" && (
                      <div className="space-y-3 border-t pt-4">
                        <Input 
                          name="title" 
                          placeholder="Question Title" 
                          value={newQuestionForm.title} 
                          onChange={handleQuestionFormChange} 
                          required={questionMode === 'add'} 
                          disabled={isLoading}
                        />
                        <textarea
                          name="description"
                          placeholder="Question Description..."
                          value={newQuestionForm.description}
                          onChange={handleQuestionFormChange}
                          className="w-full h-24 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                          required={questionMode === 'add'} 
                          disabled={isLoading}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <textarea
                            name="boilerplate_python"
                            placeholder="Python Boilerplate (def solve...)"
                            value={newQuestionForm.boilerplate_python}
                            onChange={handleQuestionFormChange}
                            className="w-full h-32 font-mono text-xs rounded border border-slate-200 bg-slate-900 text-slate-50 px-3 py-2"
                            disabled={isLoading}
                          />
                          <textarea
                            name="boilerplate_java"
                            placeholder="Java Boilerplate (class Solution...)"
                            value={newQuestionForm.boilerplate_java}
                            onChange={handleQuestionFormChange}
                            className="w-full h-32 font-mono text-xs rounded border border-slate-200 bg-slate-900 text-slate-50 px-3 py-2"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="bg-white p-3 rounded border border-slate-200">
                          <label className="text-xs font-bold text-slate-500 uppercase">Add Test Case</label>
                          <div className="flex gap-2 mt-2">
                            <Input name="input" placeholder="Input" value={newTestCase.input} onChange={handleTestCaseChange} className="font-mono text-xs" />
                            <Input name="expectedOutput" placeholder="Output" value={newTestCase.expectedOutput} onChange={handleTestCaseChange} className="font-mono text-xs" />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                              <input type="checkbox" name="isSample" checked={newTestCase.isSample} onChange={handleTestCaseChange} />
                              Visible Sample Case
                            </label>
                            <Button type="button" size="sm" variant="secondary" onClick={handleAddTestCase}>Add Case</Button>
                          </div>
                        </div>
                        {addedTestCases.length > 0 && (
                          <div className="space-y-1">
                            {addedTestCases.map((tc, idx) => (
                              <div key={idx} className="flex justify-between text-xs bg-slate-100 p-2 rounded">
                                <span className="font-mono truncate w-1/3">{tc.input}</span>
                                <span className="text-slate-400">→</span>
                                <span className="font-mono truncate w-1/3">{tc.expectedOutput}</span>
                                <span className="text-slate-500 italic">{tc.isSample ? "Sample" : "Hidden"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Processing..." : "Post Scholarship"}
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
                  <CardContent className="space-y-3 pt-6">
                    <Link to={`/company/applicants/${s.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600 block">
                      {s.scholarshipName}
                    </Link>
                    <p className="text-sm text-slate-500">
                      ₹{s.amount} • {s.minimumCgpa ? `Min CGPA: ${s.minimumCgpa}` : "No min CGPA"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {s.testMode && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          Test Mode
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold 
                        ${s.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                          s.status === "UPCOMING" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                        {s.status}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between bg-slate-50/50 py-3">
                    <select
                      value={statusMap[s.id] || s.status}
                      onChange={(e) => setStatusMap((m) => ({ ...m, [s.id]: e.target.value }))}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id)}>
                      Update
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* --- CHAT SIDEBAR (Organization) --- */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white shadow-xl transition hover:bg-emerald-500 z-50"
      >
        💬
      </button>

      {showChat && (
        <div className="fixed right-6 bottom-24 h-[500px] w-80 md:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-emerald-600 px-4 py-3 flex justify-between items-center text-white">
            <span className="font-semibold text-sm">
              {activeContact ? activeContact.name : "Applicants"}
            </span>
            {activeContact && (
              <button onClick={() => setActiveContact(null)} className="text-xs bg-emerald-700 px-2 py-1 rounded">
                Back
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50">
            {!activeContact ? (
              // Contact List
              <div className="p-2 space-y-1">
                {contacts.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 mt-10">No applicants found yet.</p>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setActiveContact(c)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white cursor-pointer hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          {c.name.charAt(0)}
                        </div>
                        {/* ONLINE DOT */}
                        {onlineUsers.has(c.id) && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Messages
              <div className="p-4 flex flex-col gap-2">
                {messages.map((m, i) => {
                  const isMe = m.sender === "ORGANIZATION" || m.senderRole === "organization";
                  return (
                    <div
                      key={i}
                      className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl shadow-sm ${
                        isMe ? "self-end bg-emerald-600 text-white rounded-br-none" : "self-start bg-white text-slate-800 rounded-bl-none"
                      }`}
                    >
                      {m.message}
                    </div>
                  );
                })}
                <div ref={chatEndRef}></div>
              </div>
            )}
          </div>

          {activeContact && (
            <div className="border-t p-3 bg-white flex gap-2">
              <input
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Reply..."
              />
              <Button size="sm" onClick={sendMessage} className="bg-emerald-600 rounded-full">
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}