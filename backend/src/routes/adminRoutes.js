const express = require("express");
const { 
  getAllUsers, 
  getAllScholarships, 
  deleteUser, 
  notifyAdmins, 
  reindexUser, 
  flushCache, 
  getAdminStats,
  getNotifications // - Import the new controller method
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// --- Notification Routes ---
// - POST to save and broadcast a new notification
router.post("/notify", protect(["ADMIN"]), notifyAdmins);
// - GET to fetch historical notifications from the DB
router.get("/notifications", protect(["ADMIN"]), getNotifications);

// --- System & Maintenance Routes ---
router.post("/reindex-user/:id", protect(["ADMIN"]), reindexUser);
router.post("/cache/flush", protect(["ADMIN"]), flushCache);
router.get("/stats", protect(["ADMIN"]), getAdminStats);

// --- User & Scholarship Management ---
router.get("/users", protect(["ADMIN"]), getAllUsers);
router.get("/scholarships", protect(["ADMIN"]), getAllScholarships);
router.delete("/user/:id", protect(["ADMIN"]), deleteUser);

module.exports = router;