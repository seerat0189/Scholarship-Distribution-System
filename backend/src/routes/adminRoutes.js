const express = require("express");
const { getAllUsers, getAllScholarships, deleteUser, getAllOrganizations } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const cache = require("../admin/cacheMiddleware");
const { notifyAdmins, flushCache } = require("../controllers/adminController");
const { getAdminStats } = require("../controllers/adminController");
const { basicSearch } = require("../controllers/adminSearchController");


const router = express.Router();

router.post("/notify", protect(["ADMIN"]), notifyAdmins);
router.post("/cache/flush", protect(["ADMIN"]), flushCache);
// router.get("/stats", protect(["ADMIN"]), getAdminStats);
router.get("/search", protect(["ADMIN"]), basicSearch);
router.get("/stats", protect(["ADMIN"]), cache(60), getAdminStats);
router.get("/users", protect(["ADMIN"]), cache(60), getAllUsers);
router.get("/scholarships", protect(["ADMIN"]), cache(60), getAllScholarships);
router.delete("/user/:id", protect(["ADMIN"]), deleteUser);
router.get("/organizations", protect(["ADMIN"]), cache(60), getAllOrganizations);

module.exports = router;
