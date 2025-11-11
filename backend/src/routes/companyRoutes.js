const express = require("express");
const { createScholarship, viewApplicants } = require("../controllers/companyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", protect(["COMPANY"]), createScholarship);
router.get("/applicants/:scholarshipId", protect(["COMPANY"]), viewApplicants);

module.exports = router;
