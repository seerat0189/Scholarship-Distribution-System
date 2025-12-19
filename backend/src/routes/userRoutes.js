// const express = require("express");
// const { getScholarships, applyForScholarship, getMyApplications} = require("../controllers/userController");
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// router.get("/scholarships", protect(["USER"]), getScholarships);
// router.post("/apply", protect(["USER"]), applyForScholarship);

// router.get("/my-applications", protect(["USER"]), getMyApplications);
// module.exports = router;
const express = require("express");
const { 
  getScholarships, 
  applyForScholarship, 
  getMyApplications 
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes (No login required)
router.get("/scholarships", getScholarships);

// Protected Routes (Login required)
// notice we pass 'protect' without brackets ()
router.post("/apply", protect, applyForScholarship);
router.get("/my-applications", protect, getMyApplications);

module.exports = router;