// const express = require("express");
// const { createScholarship, viewApplicants, getMyScholarships, updateApplicationStatus, updateScholarshipStatus } = require("../controllers/organizationController"); // Add getMyScholarships
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// // Protect for ORGANIZATION role
// router.post("/create", protect(["ORGANIZATION"]), createScholarship);
// router.get("/applicants/:scholarshipId", protect(["ORGANIZATION"]), viewApplicants);
// router.get("/my-scholarships", protect(["ORGANIZATION"]), getMyScholarships); // <-- ADD THIS LINE
// // --- ADD THIS NEW ROUTE ---
// router.patch("/application/:applicationId", protect(["ORGANIZATION"]), updateApplicationStatus);
// // Update scholarship status (UPCOMING, ACTIVE, CLOSED)
// router.patch("/scholarships/:id/status", protect(["ORGANIZATION"]), updateScholarshipStatus);
// module.exports = router;
const express = require("express");
const { 
  createScholarship, 
  updateScholarshipStatus,
  updateApplicationStatus 
} = require("../controllers/organizationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Notice: we remove the () after protect so it doesn't run immediately
router.post("/create", protect, createScholarship);
router.patch("/:id/status", protect, updateScholarshipStatus);
router.patch("/applications/:applicationId/status", protect, updateApplicationStatus);

module.exports = router;