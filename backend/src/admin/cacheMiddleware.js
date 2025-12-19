const { getClient } = require("./redisClient");

const redis = getClient();

/**
 * cache middleware
 * usage: app.get('/api/admin/something', cache(60), handler)
 * caches responses (JSON) keyed by the request originalUrl
 */
function cache(ttlSeconds = 60) {
  return async (req, res, next) => {
    try {
      const key = `cache:${req.originalUrl}`;
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      // override res.json to save response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          redis.setex(key, ttlSeconds, JSON.stringify(body)).catch((err) => {
            console.warn("Failed writing cache:", err.message);
          });
        } catch (e) {}
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      // on any error skip cache
      console.warn("Cache middleware error:", err.message);
      next();
    }
  };
}

module.exports = cache;
