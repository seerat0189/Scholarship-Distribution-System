const express = require("express");
const { getScholarships, applyForScholarship, getMyApplications} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/scholarships", protect(["USER"]), getScholarships);
router.post("/apply", protect(["USER"]), applyForScholarship);

router.get("/my-applications", protect(["USER"]), getMyApplications);

// --- NEW CODE START ---
const { getProfile, updateProfile } = require("../controllers/profileController");
router.get("/profile", protect(["USER"]), getProfile);
router.post("/profile", protect(["USER"]), updateProfile);
// --- NEW CODE END ---

module.exports = router;
