const prisma = require("../models/prismaClient.js");

/**
 * GET PROFILE
 * Fetches profile data for the authenticated user.
 * If no profile exists, it returns a template with user details.
 */
module.exports.getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.user.id);

    const profile = await prisma.profile.findFirst({
      where: { userId: userId },
    });

    // If no profile found, return default values from the User object
    // to prevent frontend undefined errors.
    if (!profile) {
      return res.json({
        name: req.user.name || "",
        email: req.user.email || "",
        cgpa: "",
        college: "",
        degree: "",
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * UPDATE/UPSERT PROFILE
 * Syncs Profile table and User table academic fields.
 */
module.exports.updateProfile = async (req, res) => {
  const userId = parseInt(req.user.id);
  const { name, email, cgpa, college, degree } = req.body;

  try {
    // We use a transaction to ensure both tables are updated or neither is.
    const result = await prisma.$transaction([
      // 1. Update or Create the Profile record
      prisma.profile.upsert({
        where: { id: req.body.id || -1 }, 
        update: { 
          name, 
          email, 
          cgpa: cgpa ? parseFloat(cgpa) : null, 
          college, 
          degree 
        },
        create: { 
          userId, 
          name, 
          email, 
          cgpa: cgpa ? parseFloat(cgpa) : null, 
          college, 
          degree 
        },
      }),
      // 2. Sync academic data back to the User table
      prisma.user.update({
        where: { id: userId },
        data: { 
          name, 
          cgpa: cgpa ? parseFloat(cgpa) : null, 
          college, 
          degree 
        },
      }),
    ]);

    res.json({ 
      message: "Profile and User account synced successfully", 
      profile: result[0] 
    });
  } catch (error) {
    console.error("❌ Profile Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};