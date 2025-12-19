const authController = require('../controllers/authController');
const prisma = require('../models/prismaClient');
const bcrypt = require('bcryptjs');
const tokenService = require('../utils/tokenService');

// Mock all dependencies
jest.mock('../models/prismaClient', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('../utils/tokenService');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('register', () => {
    it('should return 400 if email already exists', async () => {
      req.body = { name: 'Test', email: 'test@example.com', password: '123', role: 'USER' };
      
      // Mock prisma finding a user
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });
      prisma.organization.findUnique.mockResolvedValue(null);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('should create a new USER successfully', async () => {
      req.body = { name: 'Test', email: 'new@example.com', password: '123', role: 'USER' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      prisma.user.create.mockResolvedValue({ id: 1, name: 'Test', email: 'new@example.com', role: 'USER' });

      await authController.register(req, res);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'USER registered successfully'
      }));
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      req.body = { email: 'user@example.com', password: 'password123' };

      const mockUser = { id: 1, email: 'user@example.com', password: 'hashed_password', role: 'USER' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Password matches
      tokenService.generateToken.mockReturnValue('fake_jwt_token');

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'fake_jwt_token',
        role: 'USER'
      }));
    });

    it('should return 400 for invalid password', async () => {
      req.body = { email: 'user@example.com', password: 'wrongpassword' };

      const mockUser = { id: 1, email: 'user@example.com', password: 'hashed_password', role: 'USER' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Password wrong

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
});