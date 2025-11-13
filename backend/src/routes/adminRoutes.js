const express = require("express");
const { getAllUsers, getAllScholarships, deleteUser } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { notifyAdmins, reindexUser, flushCache } = require("../controllers/adminController");
const { getAdminStats } = require("../controllers/adminController");

const router = express.Router();

router.post("/notify", protect(["ADMIN"]), notifyAdmins);
router.post("/reindex-user/:id", protect(["ADMIN"]), reindexUser);
router.post("/cache/flush", protect(["ADMIN"]), flushCache);
router.get("/stats", protect(["ADMIN"]), getAdminStats);

router.get("/users", protect(["ADMIN"]), getAllUsers);
router.get("/scholarships", protect(["ADMIN"]), getAllScholarships);
router.delete("/user/:id", protect(["ADMIN"]), deleteUser);

module.exports = router;
