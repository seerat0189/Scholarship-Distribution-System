const express = require("express");
const { getAllUsers, getAllScholarships, deleteUser } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", protect(["ADMIN"]), getAllUsers);
router.get("/scholarships", protect(["ADMIN"]), getAllScholarships);
router.delete("/user/:id", protect(["ADMIN"]), deleteUser);

module.exports = router;
