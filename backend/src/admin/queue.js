const Queue = require("bull");
const { getClient } = require("./redisClient");

let queues = {}; // simple registry (singleton-ish)

function getQueue(name = "adminQueue") {
  if (queues[name]) return queues[name];

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const q = new Queue(name, redisUrl);

  // process jobs inline or in a separate worker in production
  q.process(async (job) => {
    console.log(`Processing job ${job.id} (${job.name})`, job.data);
    // Example jobs:
    if (job.name === "send-notification") {
      // integrate with your email/push service
      // dummy: just log
      console.log("Notify:", job.data);
      return { ok: true };
    }
    if (job.name === "reindex-user") {
      // you could call indexing helper
      const { indexer } = require("./indexing");
      await indexer.indexUser(job.data.user);
      return { indexed: true };
    }
    // fallback
    return { ok: true };
  });

  queues[name] = q;
  return q;
}

module.exports = { getQueue };
