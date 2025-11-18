const prisma = require("../models/prismaClient.js");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/tokenService.js");

/**
 * REGISTER - Handles user, organization, and admin registrations.
 * Role is passed from frontend (USER / ORGANIZATION / ADMIN)
 */
module.exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validate role
    const allowedRoles = ["USER", "ADMIN", "ORGANIZATION"];
    const userRole = role && allowedRoles.includes(role.toUpperCase())
      ? role.toUpperCase()
      : "USER";

    // Check if email already exists in any table
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingOrg = await prisma.organization.findUnique({ where: { email } });

    if (existingUser || existingOrg) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Admins and Users share same User table; organizations separate
    if (userRole === "ORGANIZATION") {
      const organization = await prisma.organization.create({
        data: { name, email, password: hashed },
      });
      delete organization.password;
      return res.status(201).json({
        message: "Organization registered successfully",
        organization,
      });
    } else {
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role: userRole },
      });
      delete user.password;
      return res.status(201).json({
        message: `${userRole} registered successfully`,
        user,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * LOGIN - Authenticates USER, ADMIN, or ORGANIZATION
 */
module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let account = null;
    let role = null;

    // 1️⃣ Try to find in the User table (USER or ADMIN)
    account = await prisma.user.findUnique({ where: { email } });
    if (account) {
      role = account.role || "USER";
    }

    // 2️⃣ If not found, try the Organization table
    if (!account) {
      account = await prisma.organization.findUnique({ where: { email } });
      if (account) {
        role = "ORGANIZATION";
      }
    }

    // 3️⃣ No account found
    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Password check
    const match = await bcrypt.compare(password, account.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 5️⃣ Generate JWT token
    const tokenPayload = {
      id: account.id,
      email: account.email,
      role,
    };

    const token = generateToken(tokenPayload);

    // Remove password from response
    delete account.password;

    // 6️⃣ Role-based message
    let loginMessage = "Login successful";
    if (role === "ADMIN") loginMessage = "Admin login successful";
    else if (role === "ORGANIZATION") loginMessage = "Organization login successful";

    res.json({ message: loginMessage, token, role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * REGISTER ORGANIZATION - (Legacy route retained for compatibility)
 */
module.exports.registerOrg = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingOrg = await prisma.organization.findUnique({ where: { email } });

    if (existingUser || existingOrg) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const organization = await prisma.organization.create({
      data: { name, email, password: hashed },
    });

    delete organization.password;
    res.status(201).json({
      message: "Organization registered successfully",
      organization,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
