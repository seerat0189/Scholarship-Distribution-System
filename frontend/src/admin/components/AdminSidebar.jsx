import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <h2 className="sidebar-title">Admin Portal</h2>
      <nav>
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/search">Search</NavLink>   {/* <-- Added */}
        <NavLink to="/admin/notifications">Notifications</NavLink>
      </nav>
    </aside>
  );
}
