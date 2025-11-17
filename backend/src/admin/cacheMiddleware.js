const { getClient } = require("./redisClient");

function cache(ttlSeconds = 60) {
  return async (req, res, next) => {
    try {
      const redis = getClient();
      const key = `cache:${req.originalUrl}`;

      const cached = await redis.get(key);

      // ---------- RETURN FROM CACHE ----------
      if (cached) {
        console.log("[CACHE] HIT:", key);
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      // If not cached
      console.log("[CACHE] MISS:", key);

      // ---------- STORE INTO CACHE ----------
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          await redis.setex(key, ttlSeconds, JSON.stringify(body));
          console.log("[CACHE] STORED:", key);
        } catch (err) {
          console.warn("Failed to store cache:", err.message);
        }

        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn("Cache middleware error:", err);
      next();
    }
  };
}

module.exports = cache;
