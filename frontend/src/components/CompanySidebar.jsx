import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function CompanySidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", to: "/company" },
    { label: "My Applications", to: "/company/applications" },
  ];

  return (
    <aside className="max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3 pb-6">
        <Avatar size="sm">
          <AvatarFallback>
            {user?.name?.[0] ?? user?.email?.[0] ?? "O"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-slate-900">{user?.name || "Organization"}</p>
          <p className="text-xs uppercase tracking-wide text-indigo-500">{user?.role ?? "ORGANIZATION"}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={logout}>
          <span className="text-xs">Logout</span>
        </Button>
      </div>
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              location.pathname === item.to
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">API Endpoints</h4>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>POST /companies/create</li>
          <li>GET /companies/my-scholarships</li>
          <li>GET /companies/applicants/:id</li>
          <li>PATCH /companies/application/:id</li>
          <li>PATCH /companies/scholarships/:id/status</li>
        </ul>
      </div>
    </aside>
  );
}