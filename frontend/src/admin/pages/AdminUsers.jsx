import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getAllUsers, reindexUser } from "../services/adminService";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [cached, setCached] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    getAllUsers(token).then(({ data, fromCache }) => {
      setUsers(data);
      setCached(fromCache);
    });
  }, []);

  const handleReindex = async (id) => {
    const token = localStorage.getItem("token");
    setBusyId(id);
    await reindexUser(token, id);
    setBusyId(null);
    alert("Reindex queued!");
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const needle = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(needle) ||
        user.email?.toLowerCase().includes(needle) ||
        user.id?.toString().includes(needle)
    );
  }, [search, users]);

  return (
    <div className="admin-users-page grid min-h-screen grid-cols-1 gap-8 px-4 py-6 md:grid-cols-[240px,1fr]">
      <AdminSidebar />
      <main className="space-y-6">
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">User Directory</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {cached ? "Currently showing cached results" : "Live data refreshed with every visit"}
              </CardDescription>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or ID"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              />
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>Reset</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden rounded-2xl border border-slate-100 shadow">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-indigo-500">User ID</p>
                    <h2 className="text-xl font-semibold text-slate-900">{user.id}</h2>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {user.role ?? "USER"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Name:</span> {user.name || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Email:</span> {user.email || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Applications:</span> {user.applications?.length ?? 0}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Status:</span> {user.status ?? "Active"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReindex(user.id)}
                    disabled={busyId === user.id}
                  >
                    {busyId === user.id ? "Queueing…" : "Reindex user"}
                  </Button>
                  <p className="text-xs text-slate-400">Last synced {user.lastSynced || "—"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="text-center text-sm text-slate-500">
                No users match that search term.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
