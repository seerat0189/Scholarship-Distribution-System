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

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await api.get(`/companies/applicants/${scholarshipId}`);
        setApplicants(res.data);
        if (res.data.length > 0 && res.data[0].scholarship) {
          setScholarship(res.data[0].scholarship);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch applicants", error);
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [scholarshipId]);

  const handleUpdateStatus = async (applicationId, status) => {
    if (!window.confirm(`Mark as ${status}?`)) return;
    try {
      await api.patch(`/companies/application/${applicationId}`, { status });
      setApplicants(applicants.map(app => app.id === applicationId ? { ...app, status } : app));
    } catch (error) {
      // FIX: Use the 'error' variable here so it is not marked as unused
      console.error("Update status error:", error);
      alert("Failed to update status: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr]">
        <CompanySidebar />
        <main className="space-y-6">
          <div className="flex justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
              {scholarship && <p className="text-slate-600 mt-1">For: <span className="font-semibold">{scholarship.scholarshipName}</span></p>}
            </div>
            <div className="text-sm text-slate-500">{applicants.length} applications</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {applicants.map((app) => (
              <Card key={app.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-xl">{app.user.name}</CardTitle>
                      <CardDescription>{app.user.email}</CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold h-fit ${
                      app.status === "Accepted" ? "bg-green-100 text-green-800" :
                      app.status === "Rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{app.status}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-slate-700">CGPA:</span> {app.user.cgpa || "N/A"}</div>
                    <div><span className="font-semibold text-slate-700">Degree:</span> {app.user.degree || "N/A"}</div>
                    <div className="col-span-2"><span className="font-semibold text-slate-700">College:</span> {app.user.college || "N/A"}</div>
                  </div>

                  {/* Display Total Score */}
                  {app.testScore !== null && (
                    <div className="pt-2 border-t border-slate-200 text-sm">
                      <span className="font-semibold text-slate-700">Test Score:</span>{" "}
                      {app.testScore} {app.totalScore ? `/ ${app.totalScore}` : ""}
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-slate-200 text-sm">
                    <span className="font-semibold text-slate-700">Applied:</span> {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
                {app.status === "Pending" && (
                  <CardFooter className="flex gap-2">
                    <Button onClick={() => handleUpdateStatus(app.id, "Accepted")} className="flex-1 bg-green-600 hover:bg-green-700">Accept</Button>
                    <Button onClick={() => handleUpdateStatus(app.id, "Rejected")} variant="destructive" className="flex-1">Reject</Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}