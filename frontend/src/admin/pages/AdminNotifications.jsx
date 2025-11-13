import { useState } from "react";
import { notifyAdmins, flushCache } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";

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
    <div className="admin-notifications">
      <AdminSidebar />
      <main>
        <h1>Admin Notifications</h1>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send Notification</button>
        <hr />
        <button onClick={handleFlush} className="flush-btn">Flush Cache</button>
      </main>
    </div>
  );
}
