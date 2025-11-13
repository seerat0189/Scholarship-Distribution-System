import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function ApplicantView() {
  const { scholarshipId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/companies/applicants/${scholarshipId}`);
      setApplicants(res.data);
      // A bit of a hack to get scholarship name; ideally, a separate endpoint
      if (res.data.length > 0) {
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
    if (!window.confirm(`Are you sure you want to ${status} this applicant?`)) {
      return;
    }
    try {
      await api.patch(`/companies/application/${applicationId}`, { status });
      // Update local state for immediate feedback
      setApplicants(applicants.map(app => 
        app.id === applicationId ? { ...app, status: status } : app
      ));
      alert(`Applicant ${status}!`);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Failed to update status"));
    }
  };

  if (loading) return <div className="p-6">Loading applicants...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Applicants</h2>
      {applicants.length === 0 ? (
        <p>No applicants for this scholarship yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-left">Applicant</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Test Score</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id} className="border-b">
                  <td className="p-3">{app.user.name}</td>
                  <td className="p-3">{app.user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.status === "Accepted" ? "bg-green-200 text-green-800" :
                      app.status === "Rejected" ? "bg-red-200 text-red-800" :
                      "bg-yellow-200 text-yellow-800"
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3">{app.testScore !== null ? app.testScore : "N/A"}</td>
                  <td className="p-3">
                    {app.status === "Pending" && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(app.id, "Accepted")}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, "Rejected")}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}