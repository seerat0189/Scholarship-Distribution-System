import React, { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Helper function to get status color
const getStatusClass = (status) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "accepted":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/users/my-applications");
        setApplications(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch applications", error);
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Fetching your applications...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Track the status of every scholarship you have applied for.</CardDescription>
          </CardHeader>
        </Card>

        {applications.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">No applications found. Apply to scholarships to see updates here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{app.scholarship.scholarshipName}</h3>
                      <p className="text-sm text-slate-500">from {app.scholarship.organization.name}</p>
                    </div>
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold ${getStatusClass(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-slate-800">Applied:</span>{" "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    {app.testScore !== null && (
                      <p>
                        <span className="font-medium text-slate-800">Test Score:</span>{" "}
                        {app.testScore}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}