import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Registering...");

    try {
      const { name, email, password, role } = form;
      let res;

      if (role === "USER" || role === "ADMIN") {
        res = await api.post("/auth/register", { name, email, password, role });
      } else {
        res = await api.post("/auth/register-org", { name, email, password });
      }

      setMsg("Registration successful!");

      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "ORGANIZATION") navigate("/company/dashboard");
      else navigate("/user/dashboard");

    } catch (err) {
      setMsg(err.response?.data?.message || "Error registering user");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Register</h2>

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <select name="role" value={form.role} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="USER">User</option>
          <option value="ORGANIZATION">Organization</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button className="bg-green-600 text-white w-full py-2 rounded">
          Register
        </button>

        {msg && (
          <p className="text-indigo-600 text-sm text-center">{msg}</p>
        )}
      </form>
    </div>
  );
}
