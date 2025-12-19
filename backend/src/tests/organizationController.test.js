const orgController = require('../controllers/organizationController');
const prisma = require('../models/prismaClient');

// Mock Prisma
jest.mock('../models/prismaClient', () => ({
  scholarship: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

describe('Organization Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate a logged-in organization via req.user
    req = { 
      body: {}, 
      user: { id: 101 }, 
      params: {} 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createScholarship', () => {
    it('should create a scholarship with valid data', async () => {
      req.body = {
        scholarshipName: 'Tech Grant',
        amount: '5000', // String that should parse to number
        minimumCgpa: '8.5',
        status: 'ACTIVE'
      };

      prisma.scholarship.create.mockResolvedValue({ id: 1, ...req.body, amount: 5000, minimumCgpa: 8.5 });

      await orgController.createScholarship(req, res);

      expect(prisma.scholarship.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amount: 5000,
          minimumCgpa: 8.5,
          status: 'ACTIVE',
          organizationId: 101
        })
      }));
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if amount is invalid', async () => {
      req.body = { scholarshipName: 'Bad Grant', amount: 'invalid_number' };

      await orgController.createScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Amount must be a valid number.' });
      expect(prisma.scholarship.create).not.toHaveBeenCalled();
    });
  });

  describe('updateScholarshipStatus', () => {
    it('should update status successfully if owner', async () => {
      req.params.id = '1';
      req.body.status = 'CLOSED';

      // Mock finding the scholarship and verifying owner matches req.user.id (101)
      prisma.scholarship.findUnique.mockResolvedValue({ id: 1, organizationId: 101 });
      prisma.scholarship.update.mockResolvedValue({ id: 1, status: 'CLOSED' });

      await orgController.updateScholarshipStatus(req, res);

      expect(prisma.scholarship.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'CLOSED' }));
    });

    it('should deny access if organization does not own the scholarship', async () => {
      req.params.id = '1';
      req.body.status = 'CLOSED';

      // Mock finding scholarship owned by someone else (ID 999)
      prisma.scholarship.findUnique.mockResolvedValue({ id: 1, organizationId: 999 });

      await orgController.updateScholarshipStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      
      // Fixed: Check inside the object for the message property
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/access denied/i)
        })
      );
    });
  });
});