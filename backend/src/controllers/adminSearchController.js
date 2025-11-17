const prisma = require("../models/prismaClient");
const { publish } = require("../admin/pubsub");

exports.basicSearch = async (req, res) => {
  try {
    const q = req.query.q || "";

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      }
    });

    // Search organizations
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      }
    });

    // Search scholarships
    const scholarships = await prisma.scholarship.findMany({
      where: {
        scholarshipName: { contains: q, mode: "insensitive" }
      }
    });

    console.log("----- BASIC SEARCH -----");
    console.log("Query:", q);
    console.log("Users:", users.length);
    console.log("Organizations:", organizations.length);
    console.log("Scholarships:", scholarships.length);

    // Optional Pub/Sub
    publish("admin:notifications", {
      type: "search",
      query: q,
      userCount: users.length,
      orgCount: organizations.length,
      scholarshipCount: scholarships.length,
      timestamp: new Date(),
    });

    res.json({ users, organizations, scholarships });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
};
