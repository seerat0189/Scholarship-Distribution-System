import { useState } from "react";
import { adminSearch } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const data = await adminSearch(token, query);
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="admin-search">
      <AdminSidebar />
      <main>
        <h1>Search Users / Organizations / Scholarships</h1>

        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>

        {/* Search Results */}
        {results && (
          <div className="search-results">

            {/* Users */}
            <h2>Users ({results.users.length})</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th></tr>
              </thead>
              <tbody>
                {results.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Organizations */}
            <h2>Organizations ({results.organizations.length})</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th></tr>
              </thead>
              <tbody>
                {results.organizations.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.name}</td>
                    <td>{o.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Scholarships */}
            <h2>Scholarships ({results.scholarships.length})</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {results.scholarships.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.scholarshipName}</td>
                    <td>{s.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
