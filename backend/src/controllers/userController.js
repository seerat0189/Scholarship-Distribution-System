const prisma = require("../models/prismaClient.js");

module.exports.getScholarships = async (req, res) => {
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

// UPDATE applyForScholarship
module.exports.applyForScholarship = async (req, res) => {
  // testScore is now an optional field
  const { scholarshipId, testScore } = req.body; 
  const userId = req.user.id;

  try {
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: userId,
        scholarshipId: parseInt(scholarshipId),
      },
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this scholarship" });
    }

    await prisma.application.create({
      data: {
        scholarshipId: parseInt(scholarshipId),
        userId: userId,
        testScore: testScore ? parseInt(testScore) : null, // Save the score if it exists
      },
    });
    res.json({ message: "Applied successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- ADD THIS NEW FUNCTION ---
module.exports.getMyApplications = async (req, res) => {
  const userId = req.user.id; // Get the logged-in user's ID
  try {
    const applications = await prisma.application.findMany({
      where: { userId: userId },
      include: {
        scholarship: { // Include the scholarship details
          select: {
            scholarshipName: true,
            organization: {
              select: { name: true } // Include the organization's name
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Show newest applications first
      }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};