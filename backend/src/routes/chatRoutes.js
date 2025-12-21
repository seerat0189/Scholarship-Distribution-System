const express = require("express");
const { getContacts, getChatHistory } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/contacts", protect(["USER", "ORGANIZATION"]), getContacts);
router.get("/history/:targetId", protect(["USER", "ORGANIZATION"]), getChatHistory);

module.exports = router;