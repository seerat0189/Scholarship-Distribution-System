import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css"; // <-- ADD THIS IMPORT

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
    <div className="register-root">
      <form onSubmit={handleSubmit} className="register-card">

        <h2 className="register-title">Register</h2>

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="register-input"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          className="register-input"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="register-input"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="register-select"
        >
          <option value="USER">User</option>
          <option value="ORGANIZATION">Organization</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button className="register-btn">Register</button>

        {msg && <p className="register-msg">{msg}</p>}
      </form>
    </div>
  );
}
