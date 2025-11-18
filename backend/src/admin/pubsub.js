const { getClient } = require("./redisClient");

let publisher = null;
let subscriber = null;

function getPublisher() {
  if (!publisher) publisher = getClient(); // ioredis allows duplicate clients
  return publisher;
}

function getSubscriber() {
  if (!subscriber) {
    // create a new client for subscriptions (recommended)
    const IORedis = require("ioredis");
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    subscriber = new IORedis(url);
  }
  return subscriber;
}

module.exports = {
  publish: async (channel, message) => {
    const pub = getPublisher();
    return pub.publish(channel, JSON.stringify(message));
  },
  subscribe: (channel, handler) => {
    const sub = getSubscriber();
    sub.subscribe(channel, (err) => {
      if (err) console.error("Subscribe error", err);
    });
    sub.on("message", (ch, payload) => {
      if (ch === channel) {
        try {
          handler(JSON.parse(payload));
        } catch (e) {
          handler(payload);
        }
      }
    });
  },
};
