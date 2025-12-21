const prisma = require("../models/prismaClient.js");

// Get list of people/orgs you have connected with
module.exports.getContacts = async (req, res) => {
  const { id, role } = req.user;

  try {
    if (role === "USER") {
      // Find organizations the user has applied to
      const applications = await prisma.application.findMany({
        where: { userId: id },
        select: {
          scholarship: {
            select: {
              organization: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        distinct: ['scholarshipId'] // Simplification: actually need distinct orgs
      });

      // Extract unique organizations
      const orgMap = new Map();
      applications.forEach(app => {
        const org = app.scholarship.organization;
        if (!orgMap.has(org.id)) orgMap.set(org.id, org);
      });

      return res.json(Array.from(orgMap.values()));

    } else if (role === "ORGANIZATION") {
      // Find users who have applied to this org's scholarships
      const applications = await prisma.application.findMany({
        where: {
          scholarship: { organizationId: id }
        },
        select: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Extract unique users
      const userMap = new Map();
      applications.forEach(app => {
        const u = app.user;
        if (!userMap.has(u.id)) userMap.set(u.id, u);
      });

      return res.json(Array.from(userMap.values()));
    }
    
    return res.json([]);
  } catch (error) {
    console.error("Get Contacts Error:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Get chat history between current user/org and a specific target
module.exports.getChatHistory = async (req, res) => {
  const { id, role } = req.user;
  const { targetId } = req.params; // The ID of the person/org we are chatting with

  if (!targetId) return res.status(400).json({ error: "Target ID required" });

  try {
    const userId = role === "USER" ? id : parseInt(targetId);
    const organizationId = role === "ORGANIZATION" ? id : parseInt(targetId);

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: userId,
        organizationId: organizationId
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};