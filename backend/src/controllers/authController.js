const prisma = require("../models/prismaClient.js");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/tokenService.js");

// REGISTERS A USER (Student)
module.exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user or organization already exists with this email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingOrg = await prisma.organization.findUnique({ where: { email } });
  
  if (existingUser || existingOrg) {
    return res.status(400).json({ message: "Email already registered" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "USER" }, // Role is fixed to USER
    });
    
    // Don't send password back
    delete user.password;
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REGISTERS AN ORGANIZATION
module.exports.registerOrg = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user or organization already exists with this email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingOrg = await prisma.organization.findUnique({ where: { email } });
  
  if (existingUser || existingOrg) {
    return res.status(400).json({ message: "Email already registered" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    // Create in Organization table
    const organization = await prisma.organization.create({
      data: { name, email, password: hashed },
    });

    // Don't send password back
    delete organization.password;
    res.status(201).json({ message: "Organization registered successfully", organization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// LOGS IN EITHER A USER OR AN ORGANIZATION
module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let account = null;
    let role = null;

    // 1. Try to find a User
    account = await prisma.user.findUnique({ where: { email } });
    if (account) {
      role = account.role; // Will be 'USER' or 'ADMIN'
    }

    // 2. If not a User, try to find an Organization
    if (!account) {
      account = await prisma.organization.findUnique({ where: { email } });
      if (account) {
        role = "ORGANIZATION"; // We assign this role for the token
      }
    }

    // 3. If no account found in either table
    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4. Check password
    const match = await bcrypt.compare(password, account.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 5. Generate token with the correct ID and role
    // This is the payload our tokenService expects
    const tokenPayload = {
        id: account.id,
        email: account.email,
        role: role 
    };
    
    const token = generateToken(tokenPayload); // Pass payload to token generator
    res.json({ message: "Login successful", token, role: role });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};