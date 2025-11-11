import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

// This is the API for your SEPARATE coding test server (Port 3000)
const TEST_API_URL = 'http://localhost:3000';

export default function CompanyDashboard() {
  const [form, setForm] = useState({
    scholarshipName: "",
    eligibility: "",
    amount: "",
    minimumCgpa: "",
    testMode: false,
    testQuestionId: "", // This will be set by the dropdown
  });

  const [posted, setPosted] = useState([]);
  
  // --- NEW STATE for the question list ---
  const [questionList, setQuestionList] = useState([]);
  const [testServiceError, setTestServiceError] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/company/create", form);
      alert("Scholarship Posted!");
      setPosted([res.data, ...posted]);
      // Clear form
      setForm({
        scholarshipName: "",
        eligibility: "",
        amount: "",
        minimumCgpa: "",
        testMode: false,
        testQuestionId: questionList.length > 0 ? questionList[0].id : "", // Reset to default
      });
    } catch (error) {
      alert(
        "Error posting scholarship: " +
          (error.response?.data?.message || "Server Error")
      );
    }
  };

  // --- NEW useEffect: Fetches question list from your test service ---
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${TEST_API_URL}/api/questions`);
        if (!response.ok) {
          throw new Error("Test service is not running or failed to respond.");
        }
        const data = await response.json();
        setQuestionList(data);
        if (data.length > 0) {
          // Automatically set the first question as the default
          setForm(f => ({ ...f, testQuestionId: data[0].id }));
        }
        setTestServiceError(false);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        setTestServiceError(true);
      }
    };
    fetchQuestions();
  }, []); // Runs once on component mount

  // This useEffect fetches your *posted* scholarships
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/company/my-scholarships");
        setPosted(res.data);
      } catch (error) {
        console.error("Failed to fetch scholarships", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Post New Scholarship</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="scholarshipName"
          placeholder="Scholarship Name"
          value={form.scholarshipName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="eligibility"
          placeholder="Eligibility (e.g., 'Engineering students')"
          value={form.eligibility}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount (e.g., 50000)"
          value={form.amount}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="minimumCgpa"
          type="number"
          step="0.1"
          placeholder="Minimum CGPA (Optional)"
          value={form.minimumCgpa}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={form.testMode}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="testMode" className="font-medium">
            Enable Coding Test Mode
          </label>
        </div>

        {/* --- UPDATED SECTION: Replaced text input with select dropdown --- */}
        {form.testMode && (
          <div>
            <label htmlFor="testQuestionId" className="block text-sm font-medium text-gray-700">
              Select Test Question
            </label>
            {testServiceError ? (
              <p className="text-red-600">
                Could not load questions. Make sure your coding-test-service is running on Port 3000.
              </p>
            ) : (
              <select
                name="testQuestionId"
                id="testQuestionId"
                value={form.testQuestionId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                {questionList.length === 0 ? (
                  <option value="">Loading questions...</option>
                ) : (
                  questionList.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} (ID: {q.id})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        )}
        {/* --- END OF UPDATED SECTION --- */}

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Post
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-6">Your Posted Scholarships</h3>
      <ul className="mt-3 space-y-2">
        {posted.map((s) => (
          <Link to={`/company/applicants/${s.id}`} key={s.id}>
            <li className="border p-3 rounded hover:bg-gray-100 cursor-pointer">
              {s.scholarshipName} — ₹{s.amount}
              {s.testMode && (
                <span className="ml-2 bg-indigo-200 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                  Test Mode
                </span>
              )}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}