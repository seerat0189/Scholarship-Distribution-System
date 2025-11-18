import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function AdminSidebar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <aside className="max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3 pb-6">
        <Avatar size="sm">
          <AvatarFallback>
            {user?.name?.[0] ?? user?.email?.[0] ?? "A"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-slate-900">{user?.name || "Admin"}</p>
          <p className="text-xs uppercase tracking-wide text-indigo-500">{user?.role ?? "ADMIN"}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={logout}>
          <span className="text-xs">Logout</span>
        </Button>
      </div>
      <nav className="flex flex-col gap-3">
        {[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Users", to: "/admin/users" },
          { label: "Notifications", to: "/admin/notifications" },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
