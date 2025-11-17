import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/ApplicantView.css";

export default function ApplicantView() {
  const { scholarshipId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/companies/applicants/${scholarshipId}`);
      setApplicants(res.data);

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
    if (!window.confirm(`Are you sure you want to ${status} this applicant?`)) return;

    try {
      await api.patch(`/companies/application/${applicationId}`, { status });

      setApplicants(
        applicants.map((app) =>
          app.id === applicationId ? { ...app, status: status } : app
        )
      );

      alert(`Applicant ${status}!`);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Failed to update status"));
    }
  };

  if (loading) return <div className="av-root">Loading applicants...</div>;

  return (
    <div className="av-root" style={{ background: "red" }}>
      <h2 className="av-title">Applicants</h2>

      {applicants.length === 0 ? (
        <p>No applicants for this scholarship yet.</p>
      ) : (
        <div className="av-table-container">
          <table className="av-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Status</th>
                <th>Test Score</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {applicants.map((app) => (
                <tr key={app.id}>
                  <td>{app.user.name}</td>
                  <td>{app.user.email}</td>

                  <td>
                    <span
                      className={`av-status ${
                        app.status === "Accepted"
                          ? "av-status-accepted"
                          : app.status === "Rejected"
                          ? "av-status-rejected"
                          : "av-status-pending"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>

                  <td>{app.testScore !== null ? app.testScore : "N/A"}</td>

                  <td>
                    {app.status === "Pending" && (
                      <div className="av-actions">
                        <button
                          onClick={() => handleUpdateStatus(app.id, "Accepted")}
                          className="av-btn av-btn-accept"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, "Rejected")}
                          className="av-btn av-btn-reject"
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
