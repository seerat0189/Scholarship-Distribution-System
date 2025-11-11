import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- Import
import api from "../api/axios";

export default function UserDashboard() {
  const [scholarships, setScholarships] = useState([]);
  const navigate = useNavigate(); // <-- Initialize

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/user/scholarships");
      // We need to fetch all scholarships, so let's rename the API in controller/routes
      setScholarships(res.data);
    };
    fetchData();
  }, []);

  // Update this function
  const apply = async (scholarship) => {
    if (scholarship.testMode) {
      // Test Mode is ON. Redirect to the coding test page.
      if (!scholarship.testQuestionId) {
        alert("Error: This scholarship is in test mode but has no question ID.");
        return;
      }
      // Navigate to the new test route
      navigate(`/test/${scholarship.id}/${scholarship.testQuestionId}`);
    } else {
      // Test Mode is OFF. Apply directly.
      try {
        await api.post("/user/apply", { scholarshipId: scholarship.id });
        alert("Applied successfully!");
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || "Failed to apply"));
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Available Scholarships</h2>
      <div className="grid gap-4">
        {scholarships.map((s) => (
          <div key={s.id} className="border p-4 rounded shadow">
            <h3 className="font-semibold">{s.scholarshipName}</h3> 
            <p>{s.eligibility}</p>
            <p>Amount: ₹{s.amount}</p>
            {s.testMode && <p className="text-indigo-600 font-medium">Note: This scholarship requires a coding test.</p>}
            <button
              onClick={() => apply(s)} // Pass the whole scholarship object
              className="bg-indigo-600 text-white px-3 py-1 rounded mt-2"
            >
              {s.testMode ? "Start Test & Apply" : "Apply Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}