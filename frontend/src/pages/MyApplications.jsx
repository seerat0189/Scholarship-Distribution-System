import React, { useEffect, useState } from "react";
import api from "../api/axios";

// Helper function to get status color
const getStatusClass = (status) => {
  switch (status) {
    case "Accepted":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Pending":
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

  if (loading) return <div className="p-6">Loading your applications...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Applications</h2>
      {applications.length === 0 ? (
        <p>You have not applied for any scholarships yet.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border p-4 rounded-lg shadow-md bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{app.scholarship.scholarshipName}</h3>
                  <p className="text-sm text-gray-600">from {app.scholarship.organization.name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(app.status)}`}
                >
                  {app.status}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm">
                  <span className="font-medium">Applied on:</span> {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {app.testScore !== null && (
                  <p className="text-sm">
                    <span className="font-medium">Your Test Score:</span> {app.testScore}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}