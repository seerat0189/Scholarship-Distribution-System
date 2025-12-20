import { useState, useEffect } from "react";
import { notifyAdmins, flushCache } from "../services/adminService";
import api from "../../api/axios"; 
import { adminSocket, connectAdminSocket } from "../socket";
import AdminSidebar from "../components/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Database, Send } from "lucide-react";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    connectAdminSocket(token);

    const loadHistory = async () => {
      try {
        const res = await api.get("/admin/notifications");
        setHistory(res.data);
      } catch (error) {
        // Updated to use the variable to clear red line error
        console.error("API Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();

    adminSocket.on("admin:notification", (newNotif) => {
      setHistory((prev) => [newNotif, ...prev]);
    });

    return () => {
      adminSocket.off("admin:notification");
    };
  }, []);

  const handleSend = async () => {
    if (!title || !message) return alert("Please fill in both fields");
    
    const token = localStorage.getItem("token");
    try {
      await notifyAdmins(token, { title, message });
      setTitle("");
      setMessage("");
      alert("Notification broadcasted and saved!");
    } catch (error) {
      // Updated to use the variable to clear red line error
      console.error("Broadcast Error:", error);
      alert("Error sending notification. Check console for details.");
    }
  };

  const handleFlush = async () => {
    if (!window.confirm("Are you sure? This will clear all cached Redis data.")) return;
    const token = localStorage.getItem("token");
    try {
      await flushCache(token);
      alert("System cache flushed successfully!");
    } catch (error) {
      // Updated to use the variable to clear red line error
      console.error("Cache Flush Error:", error);
      alert("Failed to flush cache.");
    }
  };

  return (
    <div className="admin-notifications min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <main className="dashboard-main flex-1 flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">System Notifications</h1>
          <Button variant="outline" onClick={handleFlush} className="text-rose-600 border-rose-200 hover:bg-rose-50">
            <Database className="mr-2 h-4 w-4" /> Flush Redis Cache
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SENDER FORM */}
          <Card className="h-fit shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Broadcast Notification
              </CardTitle>
              <CardDescription>Send a real-time update to all logged-in administrators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Database Maintenance"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter details here..."
                  className="w-full min-h-[120px] resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSend} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Send Notification
              </Button>
            </CardFooter>
          </Card>

          {/* HISTORY LIST */}
          <Card className="flex flex-col max-h-[600px] shadow-md">
            <CardHeader className="border-b bg-white sticky top-0 z-10">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Recent History
              </CardTitle>
              <CardDescription>View persistent logs of system-wide alerts.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loading ? (
                <p className="text-center py-10 text-slate-400">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-center py-10 text-slate-400">No previous notifications found.</p>
              ) : (
                history.map((n) => (
                  <div key={n.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {n.message.includes(":") ? n.message.split(":")[0] : "Admin Alert"}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {n.message.includes(":") ? n.message.split(":").slice(1).join(":") : n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 italic">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}