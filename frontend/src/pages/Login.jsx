import React, { useState, useContext } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token);
      const role = res.data.role;
      if (role === "ADMIN") navigate("/admin");
      else if (role === "COMPANY") navigate("/company");
      else navigate("/user");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96 space-y-4">
        <h2 className="text-xl font-bold text-center">Login</h2>
        <input name="email" placeholder="Email" className="w-full p-2 border rounded"
          onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password"
          className="w-full p-2 border rounded" onChange={handleChange} required />
        <button className="bg-indigo-600 text-white w-full py-2 rounded">Login</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}
