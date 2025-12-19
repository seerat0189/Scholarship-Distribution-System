import ApplicantView from "./ApplicantView";
import CodingTest from "./CodingTest";
import CompanyDashboard from "./CompanyDashboard";
import CompanyApplications from "./CompanyApplications";
import Login from "./Login";
import Register from "./Register";
import UserDashboard from "./UserDashboard";
import MyApplications from "./MyApplications";
import AdminDashboard from "../admin/pages/AdminDashboard";
import AdminUsers from "../admin/pages/AdminUsers";
import AdminNotifications from "../admin/pages/AdminNotifications";

export const publicRoutes = [
  { path: "/", element: <Login />, label: "Login" },
  { path: "/login", element: <Login />, label: "Login" },
  { path: "/register", element: <Register />, label: "Register" },
  { path: "/user", element: <UserDashboard />, label: "User Dashboard" },
  { path: "/company", element: <CompanyDashboard />, label: "Organization Dashboard" },
  { path: "/company/applications", element: <CompanyApplications />, label: "Company Applications" },
  {
    path: "/company/applicants/:scholarshipId",
    element: <ApplicantView />,
    label: "Applicant View",
  },
  {
    path: "/test/:scholarshipId/:questionId",
    element: <CodingTest />,
    label: "Coding Test",
  },
  {
    path: "/my-applications",
    element: <MyApplications />,
    label: "My Applications",
  },
  { path: "/admin", element: <AdminDashboard />, label: "Admin Dashboard" },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
    label: "Admin Dashboard"
  },
  { path: "/admin/users", element: <AdminUsers />, label: "Admin Users" },
  {
    path: "/admin/notifications",
    element: <AdminNotifications />,
    label: "Admin Notifications",
  },
];

export const protectedRoutes = [];
