const express = require("express");
const { getScholarships, applyForScholarship } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/scholarships", protect(["USER"]), getScholarships);
router.post("/apply", protect(["USER"]), applyForScholarship);

module.exports = router;
