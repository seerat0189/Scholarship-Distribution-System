import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

// Point to correct WebSocket port 4001
const socket = io("http://localhost:4001", {
  transports: ["websocket"],
  reconnection: true,
});

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);

  // --- CHAT & PRESENCE STATE ---
  const [showChat, setShowChat] = useState(false);
  const [contacts, setContacts] = useState([]); // List of Organizations
  const [activeContact, setActiveContact] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineOrgs, setOnlineOrgs] = useState(new Set()); // IDs of online orgs
  const chatEndRef = useRef(null);

  // 1. WebSocket Registration & Presence Listeners
  useEffect(() => {
    if (user?.id) {
      socket.emit("register", { id: user.id, role: "user" });
    }

    // Initial list of online orgs
    socket.on("online_orgs_list", (ids) => {
      setOnlineOrgs(new Set(ids));
    });

    // Real-time updates
    socket.on("org_status", ({ orgId, status }) => {
      setOnlineOrgs((prev) => {
        const newSet = new Set(prev);
        if (status) newSet.add(orgId);
        else newSet.delete(orgId);
        return newSet;
      });
    });

    // Receive Message
    socket.on("receive_message", (msg) => {
      if (activeContact && msg.senderRole === "organization" && msg.senderId === activeContact.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("online_orgs_list");
      socket.off("org_status");
      socket.off("receive_message");
    };
  }, [user, activeContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/users/scholarships");
        setScholarships(res.data);

        // Fetch contacts (Assume API returns all available organizations to chat with)
        const contactsRes = await api.get("/chat/contacts");
        setContacts(contactsRes.data);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    fetchData();
  }, []);

  // 3. Load Chat History
  useEffect(() => {
    if (!activeContact) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${activeContact.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };
    fetchHistory();
  }, [activeContact]);

  const sendMessage = () => {
    if (!message.trim() || !activeContact) return;
    const msgData = {
      senderId: user.id,
      senderRole: "user",
      receiverId: activeContact.id,
      receiverRole: "organization",
      message,
    };
    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, { ...msgData, sender: "USER" }]);
    setMessage("");
  };

  const apply = async (scholarship) => {
    if (scholarship.status !== "ACTIVE") {
      alert(`This scholarship is not open. Status: ${scholarship.status}`);
      return;
    }
    if (scholarship.testMode) {
      if (!scholarship.testQuestionId) {
        alert("Error: Test mode enabled but no question ID found.");
        return;
      }
      navigate(`/test/${scholarship.id}/${scholarship.testQuestionId}`);
    } else {
      try {
        await api.post("/users/apply", { scholarshipId: scholarship.id });
        alert("Applied successfully!");
        // Update contacts
        const contactsRes = await api.get("/chat/contacts");
        setContacts(contactsRes.data);
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || "Failed to apply"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Your academic opportunities await.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{user?.name || "Student"}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {user?.role}
              </span>
              <Link to="/profile">
                <Button size="sm" variant="outline">Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Scholarships */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Available Scholarships</CardTitle>
            <CardDescription>Latest opportunities from organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {scholarships.map((s) => (
                <Card key={s.id} className="space-y-4">
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{s.scholarshipName}</h3>
                        <p className="text-sm text-slate-500">{s.eligibility}</p>
                        <p className="text-sm font-medium">₹{s.amount}</p>
                        <p className="text-xs text-slate-400">By {s.organization?.name || "Organization"}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                        s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => apply(s)} disabled={s.status !== "ACTIVE"}>
                      {s.testMode ? "Take Test & Apply" : "Apply Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- CHAT SIDEBAR --- */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl text-white shadow-xl transition hover:bg-indigo-500 z-50"
      >
        💬
      </button>

      {showChat && (
        <div className="fixed right-6 bottom-24 h-[500px] w-80 md:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
            <span className="font-semibold text-sm">
              {activeContact ? activeContact.name : "Organizations"}
            </span>
            {activeContact && (
              <button onClick={() => setActiveContact(null)} className="text-xs bg-indigo-700 px-2 py-1 rounded">
                Back
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50">
            {!activeContact ? (
              // Contact List
              <div className="p-2 space-y-1">
                {contacts.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 mt-10">No organizations found.</p>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white cursor-pointer transition border border-transparent hover:border-slate-100"
                    >
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {contact.name.charAt(0)}
                        </div>
                        {/* ONLINE DOT */}
                        {onlineOrgs.has(contact.id) && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Messages
              <div className="p-4 flex flex-col gap-2">
                {messages.map((m, i) => {
                  const isMe = m.sender === "USER" || m.senderRole === "user";
                  return (
                    <div
                      key={i}
                      className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl shadow-sm ${
                        isMe ? "self-end bg-indigo-600 text-white rounded-br-none" : "self-start bg-white text-slate-800 rounded-bl-none"
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
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <Button size="sm" onClick={sendMessage} className="rounded-full bg-indigo-600">Send</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}