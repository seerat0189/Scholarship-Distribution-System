import { useEffect, useState } from "react";
import { getAllUsers, getAllOrganizations } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [userCached, setUserCached] = useState(false);
  const [orgCached, setOrgCached] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Load users
    getAllUsers(token).then(({ data, fromCache }) => {
      setUsers(data);
      setUserCached(fromCache);
    });

    // Load organizations
    getAllOrganizations(token).then(({ data, fromCache }) => {
      setOrgs(data);
      setOrgCached(fromCache);
    });
  }, []);

  return (
    <div className="admin-users">
      <AdminSidebar />
      <main>
        <h1>
          All Users{" "}
          {userCached && <span className="cached-tag">(Cached)</span>}
        </h1>

        {/* Users Table */}
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <h1>
          All Organizations{" "}
          {orgCached && <span className="cached-tag">(Cached)</span>}
        </h1>

        {/* Organizations Table */}
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th></tr>
          </thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
