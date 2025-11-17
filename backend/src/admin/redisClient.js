const IORedis = require("ioredis");

let instance = null;

function createRedis() {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
}

module.exports = {
  getClient: function () {
    if (!instance) {
      instance = createRedis();
    }
    return instance;
  },
};
