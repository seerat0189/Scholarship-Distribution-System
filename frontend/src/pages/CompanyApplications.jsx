import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CompanySidebar from "../components/CompanySidebar";

export default function CompanyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllApplications = async () => {
    try {
      // First get all scholarships
      const scholarshipsRes = await api.get("/companies/my-scholarships");
      const scholarships = scholarshipsRes.data;

      // Then get applicants for each scholarship
      const allApplications = [];
      for (const scholarship of scholarships) {
        try {
          const applicantsRes = await api.get(`/companies/applicants/${scholarship.id}`);
          const applicationsWithScholarship = applicantsRes.data.map(app => ({
            ...app,
            scholarship: {
              ...app.scholarship,
              scholarshipName: scholarship.scholarshipName,
              status: scholarship.status
            }
          }));
          allApplications.push(...applicationsWithScholarship);
        } catch {
          // Skip if no applicants
        }
      }

      setApplications(allApplications);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch applications", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllApplications();
  }, []);

  const handleUpdateStatus = async (applicationId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this applicant?`)) {
      return;
    }
    try {
      await api.patch(`/companies/application/${applicationId}`, { status });
      // Update local state for immediate feedback
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: status } : app
      ));
      alert(`Applicant ${status.toLowerCase()}!`);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Failed to update status"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr]">
          <CompanySidebar />
          <main className="space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-slate-600">Loading applications...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr]">
        <CompanySidebar />
        <main className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">All Applications</h1>
              <p className="text-slate-600 mt-1">Manage all applications across your scholarships</p>
            </div>
            <div className="text-sm text-slate-500">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>

          {applications.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Yet</h3>
                  <p className="text-slate-600">No one has applied for your scholarships yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <Card key={app.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900">{app.user.name}</CardTitle>
                        <CardDescription className="text-slate-600">{app.user.email}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        app.status === "Accepted" ? "bg-green-100 text-green-800" :
                        app.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold text-slate-700 text-sm">Scholarship:</span>
                      <Link
                        to={`/company/applicants/${app.scholarshipId}`}
                        className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        {app.scholarship.scholarshipName}
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">CGPA:</span>
                        <span className="ml-1 text-slate-600">{app.user.cgpa || "N/A"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Degree:</span>
                        <span className="ml-1 text-slate-600">{app.user.degree || "N/A"}</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">College:</span>
                      <span className="ml-1 text-slate-600">{app.user.college || "N/A"}</span>
                    </div>

                    {/* DYNAMIC SCORE DISPLAY */}
                    {app.testScore !== null && (
                      <div className="pt-1">
                        <span className="font-semibold text-slate-700 text-xs">Test Score:</span>
                        <span className="ml-1 text-slate-600 text-xs">
                          {app.testScore} / {app.totalScore}
                        </span>
                      </div>
                    )}

                    <div className="pt-1 text-xs">
                      <span className="font-semibold text-slate-700">Applied:</span>
                      <span className="ml-1 text-slate-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                  {app.status === "Pending" && (
                    <CardFooter className="flex gap-2 pt-0">
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "Accepted")}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "Rejected")}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </CardFooter>
                  )}
                  {app.status !== "Pending" && (
                    <CardFooter className="flex gap-2 pt-0">
                      <Link to={`/company/applicants/${app.scholarshipId}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}