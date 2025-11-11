import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    const load = async () => {
      const u = await api.get("/admin/users");
      const s = await api.get("/admin/scholarships");
      setUsers(u.data);
      setScholarships(s.data);
    };
    load();
  }, []);

  const deleteUser = async (id) => {
    await api.delete(`/admin/user/${id}`);
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <h3 className="mt-4 text-lg font-semibold">All Users</h3>
      <ul>
        {users.map((u) => (
          <li key={u.id} className="border p-2 flex justify-between">
            {u.email} ({u.role})
            <button onClick={() => deleteUser(u.id)} className="text-red-600">Delete</button>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-lg font-semibold">All Scholarships</h3>
      <ul>
        {scholarships.map((s) => (
          <li key={s.id} className="border p-2">{s.title} — {s.company.name}</li>
        ))}
      </ul>
    </div>
  );
}
