process.env.NODE_ENV = "test";

jest.mock("dotenv", () => ({
  config: jest.fn()
}));

const request = require("supertest");

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    $disconnect: jest.fn()
  }))
}));

const mockRouter = () => {
  const express = require("express");
  const router = express.Router();

  router.get("/test", (req, res) => {
    res.status(200).json({ ok: true });
  });

  return router;
};

jest.mock("./routes/authRoutes", () => mockRouter());
jest.mock("./routes/userRoutes", () => mockRouter());
jest.mock("./routes/organizationRoutes", () => mockRouter());
jest.mock("./routes/adminRoutes", () => mockRouter());
jest.mock("./routes/chatRoutes", () => mockRouter());

jest.mock("./middleware/errorMiddleware", () => {
  return (err, req, res, next) => {
    res.status(500).json({ error: "mock-error" });
  };
});

const app = require("./index2");

describe("index2.js API wiring", () => {

  it("auth route is mounted", async () => {
    const res = await request(app).get("/api/auth/test");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("user route is mounted", async () => {
    const res = await request(app).get("/api/users/test");
    expect(res.status).toBe(200);
  });

  it("organization route is mounted", async () => {
    const res = await request(app).get("/api/organizations/test");
    expect(res.status).toBe(200);
  });

  it("admin route is mounted", async () => {
    const res = await request(app).get("/api/admin/test");
    expect(res.status).toBe(200);
  });

  it("chat route is mounted", async () => {
    const res = await request(app).get("/api/chat/test");
    expect(res.status).toBe(200);
  });

});
