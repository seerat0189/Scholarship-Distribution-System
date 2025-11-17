import { useEffect, useState } from "react";
import { adminSocket, connectAdminSocket } from "../socket";
import { getAdminStats } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";
import "../Admin.css";

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState([]);
  const [scholarshipData, setScholarshipData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    connectAdminSocket(token);

    adminSocket.on("admin:notification", (msg) => {
      setNotifications((prev) => [msg, ...prev]);
    });

    getAdminStats(token).then((data) => {
      setStats(data);

      // Chart Data Preparation
      setUserData([
        { month: "Jan", users: data.userGrowth?.jan || 0 },
        { month: "Feb", users: data.userGrowth?.feb || 0 },
        { month: "Mar", users: data.userGrowth?.mar || 0 },
        { month: "Apr", users: data.userGrowth?.apr || 0 },
        { month: "May", users: data.userGrowth?.may || 0 },
      ]);

      setScholarshipData([
        { name: "Active", value: data.scholarships?.active || 0 },
        { name: "Closed", value: data.scholarships?.closed || 0 },
        { name: "Upcoming", value: data.scholarships?.upcoming || 0 },
      ]);
    });

    return () => adminSocket.disconnect();
  }, []);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <main className="dashboard-main">
        <h1>📊 Admin Analytics Dashboard</h1>

        {/* Summary Cards */}
        <section className="summary-cards">
          <div className="card">
            <h2>{stats.totalUsers || 0}</h2>
            <p>Total Users</p>
          </div>
          <div className="card">
            <h2>{stats.totalScholarships || 0}</h2>
            <p>Total Scholarships</p>
          </div>
          <div className="card">
            <h2>{stats.pendingApplications || 0}</h2>
            <p>Pending Applications</p>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts">
          <div className="chart-box">
            <h3>User Growth Over Months</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8884d8" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Scholarship Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scholarshipData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {scholarshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Admin Actions */}
<section className="admin-actions">
  <h2>Admin Actions</h2>
  <button
    onClick={async () => {
      const token = localStorage.getItem("token");
      console.log("Flushing cache...");
      const res = await import("../services/adminService")
        .then(m => m.flushCache(token));
      console.log("Cache flushed:", res.data);
      alert("Cache flushed successfully!");
    }}
  >
    Flush Cache
  </button>
</section>


        {/* Live Notifications */}
        <section className="live-updates">
          <h2>Live Notifications</h2>
          <ul>
            {notifications.map((n, i) => (
              <li key={i}>
                <strong>{n.title}</strong> — {n.message}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}