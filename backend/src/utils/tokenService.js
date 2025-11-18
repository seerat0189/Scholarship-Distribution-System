const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (id, email, role, etc.)
 * @returns {String} - Signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || "mysecretkey";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || "mysecretkey";
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
