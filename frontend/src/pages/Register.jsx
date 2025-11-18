import React, { useMemo, useState, useContext } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthContext } from "../context/AuthContext";

/**
 * Enhanced Register component
 * - Tailwind CSS styling
 * - Controlled inputs (value + onChange)
 * - Role-specific fields for ORGANIZATION
 * - Password show/hide + strength meter
 * - Loading state + disabled submit
 * - Clear success / error handling
 */

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER", // "USER" | "ORGANIZATION" | "ADMIN"
    organizationName: "",
    organizationWebsite: "",
  });

  const [msg, setMsg] = useState({ type: "", text: "" }); // {type: 'info'|'success'|'error', text }
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // simple email regex for client-side validation
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // password strength heuristic
  const passwordScore = useMemo(() => {
    const pw = form.password || "";
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // 0..4
  }, [form.password]);

  const passwordStrengthLabel = ["Very weak", "Weak", "Okay", "Good", "Strong"][passwordScore];

  const canSubmit = useMemo(() => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return false;
    if (!isValidEmail(form.email)) return false;
    if (form.role === "ORGANIZATION" && !form.organizationName.trim()) return false;
    return true;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setMsg({ type: "error", text: "Please fix validation errors before submitting." });
      return;
    }

    setLoading(true);
    setMsg({ type: "info", text: "Registering..." });

    try {
      const { name, email, password, role, organizationName, organizationWebsite } = form;

      if (role === "USER" || role === "ADMIN") {
        await api.post("/auth/register", { name, email, password, role });
      } else {
        // ORGANIZATION registration payload includes extra fields if provided
        await api.post("/auth/register-org", {
          name,
          email,
          password,
          organizationName,
          organizationWebsite,
        });
      }

      // success
      setMsg({ type: "success", text: "Registration successful! Logging in..." });

      // Auto-login after register
      try {
        const loginRes = await api.post("/auth/login", { email, password });
        login(loginRes.data.token);
        setMsg({ type: "success", text: "Registration and login successful! Redirecting..." });
      } catch (loginErr) {
        // If login fails, still navigate, but warn
        console.error("Auto-login failed:", loginErr);
        setMsg({ type: "success", text: "Registration successful! Please log in manually." });
      }

      // short delay to let the user read success message (optional)
      setTimeout(() => {
        if (role === "ADMIN") navigate("/admin/dashboard");
        else if (role === "ORGANIZATION") navigate("/company");
        else navigate("/user/dashboard");
      }, 700);

    } catch (err) {
      // prefer server message; fallback to generic
      const message = err?.response?.data?.message || err?.message || "Error registering user";
      setMsg({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <UserPlus className="h-9 w-9 text-indigo-600 mr-2" />
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-900">
            Quick & secure sign up — choose your role and get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {msg.text && (
              <Alert variant={msg.type === "error" ? "destructive" : "default"}>
                <AlertTitle>{msg.type === "success" ? "Success" : "Notice"}</AlertTitle>
                <AlertDescription>{msg.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1 text-sm">
              <label className="font-medium text-slate-900">Full name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="font-medium text-slate-900">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className={form.email && !isValidEmail(form.email) ? "border-red-400 focus:ring-red-300" : ""}
              />
              {form.email && !isValidEmail(form.email) && (
                <p className="text-xs text-red-500">Please enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-medium">Password</span>
                <span className="text-xs text-slate-400">{passwordStrengthLabel}</span>
              </div>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/70 text-slate-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(passwordScore / 4) * 100}%` }}
                  className={`h-full transition-all ${
                    passwordScore <= 1 ? "bg-red-400" : passwordScore === 2 ? "bg-amber-400" : "bg-green-500"
                  }`}
                ></div>
              </div>
              <p className="text-xs text-slate-700">Use a mix of letters, numbers & symbols.</p>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-900">Role</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: "USER", label: "User" },
                  { value: "ORGANIZATION", label: "Organization" },
                  { value: "ADMIN", label: "Admin" },
                ].map((r) => (
                  <Button
                    key={r.value}
                    variant={form.role === r.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            {form.role === "ORGANIZATION" && (
              <div className="space-y-3">
                <div className="space-y-1 text-sm">
                  <label className="font-medium text-slate-900">Organization name</label>
                  <Input
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div className="space-y-1 text-sm">
                  <label className="font-medium text-slate-900">Website (optional)</label>
                  <Input
                    name="organizationWebsite"
                    value={form.organizationWebsite}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="80" strokeLinecap="round" />
                  </svg>
                  Registering...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-slate-900">
          Already have an account? {" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
          <p className="mt-2 text-[11px] text-slate-700">
            By creating an account you agree to our <span className="underline">Terms</span> & <span className="underline">Privacy</span>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
