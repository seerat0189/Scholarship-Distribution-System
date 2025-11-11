import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function CompanyDashboard() {
  const [form, setForm] = useState({ title: "", description: "", amount: "", deadline: "" });
  const [posted, setPosted] = useState([]);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post("/company/create", form);
    alert("Scholarship Posted!");
    setPosted([...posted, res.data]);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/user/scholarships");
      setPosted(res.data.filter((s) => s.companyId));
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Post New Scholarship</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="title" placeholder="Title" onChange={handleChange} className="w-full p-2 border rounded" />
        <textarea name="description" placeholder="Description" onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="amount" placeholder="Amount" onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="date" name="deadline" onChange={handleChange} className="w-full p-2 border rounded" />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Post</button>
      </form>

      <h3 className="text-xl font-semibold mt-6">Your Scholarships</h3>
      <ul className="mt-3 space-y-2">
        {posted.map((s) => (
          <li key={s.id} className="border p-3 rounded">
            {s.title} — ₹{s.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
