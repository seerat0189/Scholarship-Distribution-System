import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function ApplicantView() {
  const { scholarshipId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/companies/applicants/${scholarshipId}`);
      setApplicants(res.data);
      // Get scholarship details from the first application if available
      if (res.data.length > 0 && res.data[0].scholarship) {
        setScholarship(res.data[0].scholarship);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch applicants", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [scholarshipId]);

  const handleUpdateStatus = async (applicationId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this applicant?`)) {
      return;
    }
    try {
      await api.patch(`/companies/application/${applicationId}`, { status });
      // Update local state for immediate feedback
      setApplicants(applicants.map(app =>
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
              <div className="text-lg text-slate-600">Loading applicants...</div>
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
              <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
              {scholarship && (
                <p className="text-slate-600 mt-1">
                  For: <span className="font-semibold">{scholarship.scholarshipName}</span>
                </p>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {applicants.length} application{applicants.length !== 1 ? 's' : ''}
            </div>
          </div>

          {applicants.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Yet</h3>
                  <p className="text-slate-600">No one has applied for this scholarship yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {applicants.map((app) => (
                <Card key={app.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-slate-900">{app.user.name}</CardTitle>
                        <CardDescription className="text-slate-600">{app.user.email}</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === "Accepted" ? "bg-green-100 text-green-800" :
                        app.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">CGPA:</span>
                        <span className="ml-2 text-slate-600">{app.user.cgpa || "N/A"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Degree:</span>
                        <span className="ml-2 text-slate-600">{app.user.degree || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-slate-700">College:</span>
                        <span className="ml-2 text-slate-600">{app.user.college || "N/A"}</span>
                      </div>
                    </div>

                    {app.testScore !== null && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-700">Test Score:</span>
                        <span className="ml-2 text-slate-600">{app.testScore}/100</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Applied:</span>
                      <span className="ml-2 text-slate-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                  {app.status === "Pending" && (
                    <CardFooter className="flex gap-2 pt-0">
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "Accepted")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "Rejected")}
                        variant="destructive"
                        className="flex-1"
                      >
                        Reject
                      </Button>
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