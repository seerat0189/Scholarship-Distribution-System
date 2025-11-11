import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <span className="font-bold text-xl">🎓 Scholarship Portal</span>
      <div className="flex items-center gap-3">
        {!user ? (
          <>
            <Link to="/login" className="hover:text-indigo-400">Login</Link>
            <Link to="/register" className="hover:text-indigo-400">Register</Link>
          </>
        ) : (
          <>
            <span className="text-sm">{user.email} ({user.role})</span>
            <button onClick={logout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
