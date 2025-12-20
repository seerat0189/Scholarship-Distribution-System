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
      // NOTE: Use registerOrg for organizations to handle extra fields like website.
      // This block is a fallback for generic /register calls.
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
    console.error("Register Error:", error);
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
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * REGISTER ORGANIZATION
 * Explicit route for organizations to capture additional fields (website, etc.)
 */
module.exports.registerOrg = async (req, res) => {
  // ⬇️ FIX APPLIED: Added 'organizationWebsite' here
  const { name, email, password, organizationName, organizationWebsite } = req.body;

  // Use organizationName if provided, otherwise fallback to 'name'
  const finalName = organizationName || name;

  if (!finalName) {
      return res.status(400).json({ message: "Organization Name is required" });
  }

  try {
    // Check for existing accounts
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingOrg = await prisma.organization.findUnique({ where: { email } });

    if (existingUser || existingOrg) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Create organization
    const organization = await prisma.organization.create({
      data: { 
          name: finalName, 
          email, 
          password: hashed,
          // Now organizationWebsite is defined and can be used
          website: organizationWebsite || null 
      },
    });

    delete organization.password;
    res.status(201).json({
      message: "Organization registered successfully",
      organization,
    });
  } catch (error) {
    console.error("❌ Register Org Error:", error);
    res.status(500).json({ error: error.message });
  }
};