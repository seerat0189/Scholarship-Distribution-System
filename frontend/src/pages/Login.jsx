import React, { useState, useContext } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LogIn } from "lucide-react";
import "../styles/Login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token);
      const role = res.data.role;

      // Navigate based on role
      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "ORGANIZATION") navigate("/company");
      else navigate("/user");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <form onSubmit={handleSubmit}>

          <div className="text-center">
            {/* <LogIn className="mx-auto h-12 w-auto text-indigo-600" /> */}

            <h2 className="login-title">
              Sign in to your account
            </h2>

            <p className="login-subtext">
              Or{" "}
              <Link to="/register">
                create a new account
              </Link>
            </p>
          </div>

          {error && (
            <div className="login-alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="login-input"
              placeholder="you@example.com"
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="login-input"
              placeholder="••••••••"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>
      </div>
    </div>
  );
}
