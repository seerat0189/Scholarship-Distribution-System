import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="navbar-root">
      <span className="navbar-logo">🎓 Scholarship Portal</span>
        <div className="navbar-right">
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

            <button onClick={logout} className="navbar-logout">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}