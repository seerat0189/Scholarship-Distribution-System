const request = require('supertest');
const { app } = require('../app'); 

// Mock dependencies to avoid database/redis connections
jest.mock('../models/prismaClient', () => ({
  user: { findUnique: jest.fn() },
}));
jest.mock('../admin/redisClient', () => ({
  getClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    disconnect: jest.fn(),
  })),
}));
jest.mock('../admin/socket.js', () => ({
  attachSocket: jest.fn(),
}));

describe('App Integration Test (Smoke Test)', () => {
  it('should return 200 OK on the root route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-random-route');
    expect(res.statusCode).toEqual(404);
  });
});
