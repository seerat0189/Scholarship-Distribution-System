const userController = require('../controllers/userController');
const prisma = require('../models/prismaClient');

jest.mock('../models/prismaClient', () => ({
  application: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  scholarship: {
    findMany: jest.fn(),
  },
}));

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      body: {}, 
      user: { id: 50 }, // Mock logged in user
      params: {} 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('applyForScholarship', () => {
    it('should apply successfully if not already applied', async () => {
      req.body = { scholarshipId: '10', testScore: '95' };

      // Mock: No existing application found
      prisma.application.findFirst.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue({ id: 1 });

      await userController.applyForScholarship(req, res);

      expect(prisma.application.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 50,
          scholarshipId: 10,
          testScore: 95
        })
      }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Applied successfully' });
    });

    it('should return 400 if already applied', async () => {
      req.body = { scholarshipId: '10' };

      // Mock: Existing application found
      prisma.application.findFirst.mockResolvedValue({ id: 1 });

      await userController.applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      
      // Fixed: Check inside the object for the message property
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already applied/i)
        })
      );
    });
  });
});