const jwt = require("jsonwebtoken");

// Changed to accept a payload object
const generateToken = (payload) => {
  return jwt.sign(
    payload, // Sign the whole payload (id, email, role)
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

module.exports = { generateToken };