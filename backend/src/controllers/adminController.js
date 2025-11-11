const prisma = require("../models/prismaClient.js");

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.getAllScholarships = async (req, res) => {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: {
        organization: true, // <-- This was 'company'
      },
    });
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};