const express = require("express");
const { createScholarship, viewApplicants, getMyScholarships,updateApplicationStatus } = require("../controllers/organizationController"); // Add getMyScholarships
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect for ORGANIZATION role
router.post("/create", protect(["ORGANIZATION"]), createScholarship);
router.get("/applicants/:scholarshipId", protect(["ORGANIZATION"]), viewApplicants);
router.get("/my-scholarships", protect(["ORGANIZATION"]), getMyScholarships); // <-- ADD THIS LINE
// --- ADD THIS NEW ROUTE ---
router.patch("/application/:applicationId", protect(["ORGANIZATION"]), updateApplicationStatus);
module.exports = router;