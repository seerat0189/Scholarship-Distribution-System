const express = require("express");
const { getScholarships, applyForScholarship, getMyApplications} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/scholarships", protect(["USER"]), getScholarships);
router.post("/apply", protect(["USER"]), applyForScholarship);

router.get("/my-applications", protect(["USER"]), getMyApplications);
module.exports = router;
