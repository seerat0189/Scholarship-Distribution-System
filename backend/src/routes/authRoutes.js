// const express = require("express");
// // Import all three functions from our controller
// const { register, registerOrg, login } = require("../controllers/authController");

// const router = express.Router();

// router.post("/register", register);
// router.post("/register-org", registerOrg); // This line will no longer crash
// router.post("/login", login);

// module.exports = router;
const express = require("express");
const { register, registerOrg, login } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/register-org", registerOrg);
router.post("/login", login);

module.exports = router;