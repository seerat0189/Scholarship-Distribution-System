import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function UserDashboard() {
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/user/scholarships");
      setScholarships(res.data);
    };
    fetchData();
  }, []);

  const apply = async (id) => {
    await api.post("/user/apply", { scholarshipId: id });
    alert("Applied successfully!");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Available Scholarships</h2>
      <div className="grid gap-4">
        {scholarships.map((s) => (
          <div key={s.id} className="border p-4 rounded shadow">
            <h3 className="font-semibold">{s.title}</h3>
            <p>{s.description}</p>
            <p>Amount: ₹{s.amount}</p>
            <button
              onClick={() => apply(s.id)}
              className="bg-indigo-600 text-white px-3 py-1 rounded mt-2"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
