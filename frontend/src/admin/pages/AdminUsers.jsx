import { useEffect, useState } from "react";
import { getAllUsers, reindexUser } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    getAllUsers(token).then(({ data, fromCache }) => {
      setUsers(data);
      setCached(fromCache);
    });
  }, []);

  const handleReindex = async (id) => {
    const token = localStorage.getItem("token");
    await reindexUser(token, id);
    alert("Reindex queued!");
  };

  return (
    <div className="admin-users">
      <AdminSidebar />
      <main>
        <h1>All Users {cached && <span className="cached-tag">(Cached)</span>}</h1>
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><button onClick={() => handleReindex(u.id)}>Reindex</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
