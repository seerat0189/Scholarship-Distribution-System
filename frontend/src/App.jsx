import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import ApplicantView from "./pages/ApplicantView";
import CodingTest from "./pages/CodingTest";
import MyApplications from "./pages/MyApplications"; // <-- 1. IMPORT

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
          {/* --- 2. ADD THIS NEW ROUTE --- */}
          <Route 
            path="/my-applications" 
            element={<ProtectedRoute roles={["USER"]}><MyApplications /></ProtectedRoute>} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
