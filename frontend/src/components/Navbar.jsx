import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <span className="font-bold text-xl">🎓 Scholarship Portal</span>
      <div className="flex items-center gap-4"> {/* Increased gap */}
        {!user ? (
          <>
            <Link to="/login" className="hover:text-indigo-400">Login</Link>
            <Link to="/register" className="hover:text-indigo-400">Register</Link>
          </>
        ) : (
          <>
            <span className="text-sm">{user.email} ({user.role})</span>

            {/* --- START OF MODIFICATION --- */}

            {/* Show dashboard links based on role */}
            {user.role === 'USER' && (
              <Link to="/user" className="hover:text-indigo-400 text-sm">Dashboard</Link>
            )}
            {user.role === 'ORGANIZATION' && (
              <Link to="/company" className="hover:text-indigo-400 text-sm">Dashboard</Link>
            )}
            {user.role === 'ADMIN' && (
              <Link to="/admin" className="hover:text-indigo-400 text-sm">Dashboard</Link>
            )}

            {/* Show "My Applications" link ONLY for USERS */}
            {user.role === 'USER' && (
              <Link to="/my-applications" className="hover:text-indigo-400 text-sm">My Applications</Link>
            )}
            {/* --- END OF MODIFICATION --- */}

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="rounded-full border border-slate-200 p-0"
                aria-label="Toggle profile overlay"
              >
                <Avatar>
                  <AvatarFallback>
                    {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.name || "Scholar"}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-indigo-500">
                    Role: {user?.role ?? "Guest"}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Link to="/profile" className="text-sm text-indigo-600 hover:underline">
                      View profile
                    </Link>
                    <button
                      onClick={logout}
                      className="ml-auto rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}