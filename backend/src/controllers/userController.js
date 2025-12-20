const prisma = require("../models/prismaClient.js");

module.exports.getScholarships = async (req, res) => {
  try {
    // FIX: Select specific fields to prevent crashes if relation data is incomplete
    const scholarships = await prisma.scholarship.findMany({
      include: {
        organization: {
          select: {
            name: true,
            email: true
          }
        }, 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(scholarships);
  } catch (error) {
    console.error("❌ Error fetching scholarships:", error);
    res.status(500).json({ error: "Failed to load scholarships" });
  }
};

module.exports.applyForScholarship = async (req, res) => {
  // FIX: Capture totalScore from frontend
  const { scholarshipId, testScore, totalScore } = req.body; 
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
        testScore: testScore !== undefined ? parseInt(testScore) : null,
        // FIX: Save the total score to the database
        totalScore: totalScore !== undefined ? parseInt(totalScore) : null,
      },
    });
    res.json({ message: "Applied successfully" });
  } catch (error) {
    console.error("Apply Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.getMyApplications = async (req, res) => {
  const userId = req.user.id;
  try {
    const applications = await prisma.application.findMany({
      where: { userId: userId },
      include: {
        scholarship: {
          select: {
            scholarshipName: true,
            organization: {
              select: { name: true } 
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};