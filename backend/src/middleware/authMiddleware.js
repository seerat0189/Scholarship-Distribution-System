// import jwt from "jsonwebtoken";

// export const protect = (roles = []) => {
//   return (req, res, next) => {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ message: "Not authorized" });

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       if (roles.length && !roles.includes(decoded.role)) {
//         return res.status(403).json({ message: "Access denied" });
//       }
//       req.user = decoded;
//       next();
//     } catch (error) {
//       res.status(401).json({ message: "Token invalid" });
//     }
//   };
// };
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  // Check for Bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to request object
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };