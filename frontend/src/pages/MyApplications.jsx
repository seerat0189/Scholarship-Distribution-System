import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/MyApplications.css";

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

  if (loading) return <div className="ma-root">Loading your applications...</div>;

  return (
    <div className="ma-root">
      <h2 className="ma-title">My Applications</h2>

      {applications.length === 0 ? (
        <p>You have not applied for any scholarships yet.</p>
      ) : (
        <div className="ma-list">
          {applications.map((app) => (
            <div key={app.id} className="ma-card">
              <div className="ma-card-header">
                <div>
                  <h3 className="ma-sch-name">{app.scholarship.scholarshipName}</h3>
                  <p className="ma-org">from {app.scholarship.organization.name}</p>
                </div>

                <span className={`ma-status ${
                  app.status === "Accepted"
                    ? "ma-status-accepted"
                    : app.status === "Rejected"
                    ? "ma-status-rejected"
                    : "ma-status-pending"
                }`}>
                  {app.status}
                </span>
              </div>

              <div className="ma-details">
                <p>
                  <span className="ma-label">Applied on:</span>{" "}
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>

                {app.testScore !== null && (
                  <p>
                    <span className="ma-label">Your Test Score:</span> {app.testScore}
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
