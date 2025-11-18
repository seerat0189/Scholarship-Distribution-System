import { useEffect, useState } from "react";
import { adminSocket, connectAdminSocket } from "../socket";
import { getAdminStats } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="admin-dashboard min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="dashboard-main space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">📊 Admin Analytics</h1>
          <Button variant="secondary">Refresh Stats</Button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[{
            title: "Total Users",
            value: stats.totalUsers || 0,
            description: "All registered applicants & organizations",
          }, {
            title: "Total Scholarships",
            value: stats.totalScholarships || 0,
            description: "Active and archived scholarship opportunities",
          }, {
            title: "Pending Applications",
            value: stats.pendingApplications || 0,
            description: "Applications awaiting review",
          }].map((item) => (
            <Card key={item.title} className="bg-white">
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{item.value}</div>
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Latest onboarding trends.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#6366f1" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Scholarship Distribution</CardTitle>
              <CardDescription>Status across the board.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
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
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Live Notifications</CardTitle>
              <CardDescription>Instant alerts streamed via socket.</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No recent activity.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n, i) => (
                    <li key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500">{n.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}