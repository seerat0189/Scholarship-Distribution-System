const prisma = require("../models/prismaClient.js");
const { getQueue } = require("../admin/queue");
const { publish } = require("../admin/pubsub");
const { getClient: getRedis } = require("../admin/redisClient");

/**
 * POST /api/admin/notify
 * Saves notification to DB and broadcasts via PubSub/Socket
 */
module.exports.notifyAdmins = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // 1. Save to Database for persistence
    const savedNotification = await prisma.notification.create({
      data: {
        message: `${title}: ${message}`,
        type: type || "INFO",
      },
    });

    // 2. Publish for live websocket broadcast
    await publish("admin:notifications", savedNotification);

    // 3. Optional: Add to background queue for logging/processing
    const q = getQueue("adminQueue");
    const job = await q.add("log-notification", { title, message }, { removeOnComplete: true });

    res.json({ ok: true, notification: savedNotification, jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/notifications
 * Fetches historical notifications for the admin dashboard
 */
module.exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
};

// --- REMAINDER OF EXISTING FUNCTIONS ---

module.exports.reindexUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const q = getQueue("adminQueue");
    await q.add("reindex-user", { user }, { removeOnComplete: true });

    res.json({ ok: true, queuedFor: "reindex-user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.flushCache = async (req, res) => {
  try {
    const redis = getRedis();
    await redis.flushdb();
    res.json({ ok: true, message: "Redis DB flushed (admin request)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
      include: { organization: true },
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

module.exports.getAdminStats = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = "admin:stats";
    const cached = await redis.get(cacheKey);
    if (cached) return res.set("X-Cache", "HIT").json(JSON.parse(cached));

    const [totalUsers, totalScholarships, pendingApplications] = await Promise.all([
      prisma.user.count(),
      prisma.scholarship.count(),
      prisma.application.count({ where: { status: "Pending" } }),
    ]);

    const users = await prisma.user.findMany({ select: { createdAt: true } });
    const growthMap = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0 };

    users.forEach((u) => {
      const month = u.createdAt.toLocaleString("en-US", { month: "short" });
      if (growthMap[month] !== undefined) growthMap[month]++;
    });

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
      userGrowth: { jan: growthMap.Jan, feb: growthMap.Feb, mar: growthMap.Mar, apr: growthMap.Apr, may: growthMap.May },
      scholarships,
      lastUpdated: new Date(),
    };

    await redis.setex(cacheKey, 120, JSON.stringify(analytics));
    res.set("X-Cache", "MISS").json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};