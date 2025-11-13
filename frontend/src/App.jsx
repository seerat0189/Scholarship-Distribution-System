import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./admin/pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import ApplicantView from "./pages/ApplicantView.jsx";
import CodingTest from "./pages/CodingTest";
import MyApplications from "./pages/MyApplications";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminNotifications from "./admin/pages/AdminNotifications";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user" element={<ProtectedRoute roles={["USER"]}><UserDashboard /></ProtectedRoute>} />
         <Route path="/company" element={<ProtectedRoute roles={["ORGANIZATION"]}><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />

          <Route 
            path="/company/applicants/:scholarshipId" 
            element={<ProtectedRoute roles={["ORGANIZATION"]}><ApplicantView /></ProtectedRoute>} 
          />
          <Route 
            path="/test/:scholarshipId/:questionId" 
            element={<ProtectedRoute roles={["USER"]}><CodingTest /></ProtectedRoute>} 
          />
          <Route 
            path="/my-applications" 
            element={<ProtectedRoute roles={["USER"]}><MyApplications /></ProtectedRoute>} 
          />

          <Route path="/admin/dashboard" element={<AdminDashboard />} roles={["ADMIN"]} />
          <Route path="/admin/users" element={<AdminUsers />} roles={["ADMIN"]} />
          <Route path="/admin/notifications" element={<AdminNotifications />} roles={["ADMIN"]} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
