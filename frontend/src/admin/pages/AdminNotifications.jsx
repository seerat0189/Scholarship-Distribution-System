import { useState } from "react";
import { notifyAdmins, flushCache } from "../services/adminService";
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

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    await notifyAdmins(token, { title, message });
    alert("Notification sent to all admins!");
  };

  const handleFlush = async () => {
    const token = localStorage.getItem("token");
    await flushCache(token);
    alert("Cache flushed successfully!");
  };

  return (
    <div className="admin-notifications min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="dashboard-main flex flex-col gap-6 p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Broadcast Notification</CardTitle>
            <CardDescription>Send a quick update to every admin team member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New maintenance window"
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We will be doing a system refresh ..."
                className="w-full min-h-[120px] resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSend}>Send Notification</Button>
            <Button variant="ghost" onClick={handleFlush} className="text-rose-600">
              Flush Cache
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
