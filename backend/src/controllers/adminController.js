const prisma = require("../models/prismaClient.js");
const { publish } = require("../admin/pubsub");
const { getClient: getRedis } = require("../admin/redisClient");

/**
 * POST /api/admin/notify
 * body: { title, message }
 */
module.exports.notifyAdmins = async (req, res) => {
  try {
    const { title, message } = req.body;

    // Publish notification to all admins via Redis pubsub
    await publish("admin:notifications", {
      title,
      message,
      createdAt: new Date(),
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/admin/cache/flush
 * Clears all keys starting with "cache:"
 */
module.exports.flushCache = async (req, res) => {
  try {
    const redis = getRedis();

    const keys = await redis.keys("cache:*");
    await Promise.all(keys.map((k) => redis.del(k)));

    console.log("[CACHE] Flushed keys:", keys.length);

    // Notify admins via pub/sub
    publish("admin:notifications", {
      type: "cache_flush",
      count: keys.length,
      timestamp: new Date(),
    });

    res.json({ ok: true, flushed: keys.length });
  } catch (err) {
    console.error("Flush cache error:", err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * GET /api/admin/users
 */
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/scholarships
 */
module.exports.getAllScholarships = async (req, res) => {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: {
        organization: true,
      },
    });
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/organizations
 */
module.exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany();
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * DELETE /api/admin/user/:id
 */
module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/stats
 */
module.exports.getAdminStats = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = "admin:stats";

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.set("X-Cache", "HIT").json(JSON.parse(cached));
    }

    // Basic counts
    const [totalUsers, totalScholarships, pendingApplications] = await Promise.all([
      prisma.user.count(),
      prisma.scholarship.count(),
      prisma.application.count({ where: { status: "Pending" } }),
    ]);

    // Build user monthly growth (Prisma data only)
    const users = await prisma.user.findMany({ select: { createdAt: true } });

    const growthMap = {
      Jan: 0,
      Feb: 0,
      Mar: 0,
      Apr: 0,
      May: 0,
    };

    users.forEach((u) => {
      const month = u.createdAt.toLocaleString("en-US", { month: "short" });
      if (growthMap[month] !== undefined) {
        growthMap[month]++;
      }
    });

    // Scholarship status distribution
    const scholarshipStatuses = await prisma.scholarship.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const scholarships = {
      active: scholarshipStatuses.find((s) => s.status === "ACTIVE")?._count.status || 0,
      closed: scholarshipStatuses.find((s) => s.status === "CLOSED")?._count.status || 0,
      upcoming: scholarshipStatuses.find((s) => s.status === "UPCOMING")?._count.status || 0,
    };

    const analytics = {
      totalUsers,
      totalScholarships,
      pendingApplications,
      userGrowth: {
        jan: growthMap.Jan,
        feb: growthMap.Feb,
        mar: growthMap.Mar,
        apr: growthMap.Apr,
        may: growthMap.May,
      },
      scholarships,
      lastUpdated: new Date(),
    };

    // Cache for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(analytics));

    res.set("X-Cache", "MISS").json(analytics);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: error.message });
  }
};
