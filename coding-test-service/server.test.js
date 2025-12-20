const request = require('supertest');
const axios = require('axios');

// 1. MOCKING MODULES
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(true),
  }));
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: jest.fn().mockResolvedValue({
      id: 'job-123',
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: { sampleResults: [], hiddenPassed: 1, hiddenTotal: 1 }
    }),
    close: jest.fn()
  })),
  Worker: jest.fn().mockImplementation(() => ({ 
    on: jest.fn(), 
    close: jest.fn() 
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({ 
    on: jest.fn(), 
    close: jest.fn() 
  }))
}));

jest.mock('axios');

// 2. IMPORT THE APP
const app = require('./server'); 

describe('Coding Test Service API Endpoints', () => {
    
    describe('GET /api/questions', () => {
        it('should return a list of question titles and IDs', async () => {
            const res = await request(app).get('/api/questions');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    describe('GET /api/question/:id', () => {
        it('should return 404 for non-existent question', async () => {
            const res = await request(app).get('/api/question/fake-id');
            expect(res.statusCode).toEqual(404);
        });

        it('should return a specific question by ID', async () => {
            const res = await request(app).get('/api/question/two-sum');
            expect(res.statusCode).toEqual(200);
        });
    });

    describe('POST /api/submit', () => {
        it('should enqueue a job and return a jobId', async () => {
            const submission = {
                code: "print('hello')",
                language: "python",
                questionId: "two-sum"
            };
            const res = await request(app)
                .post('/api/submit')
                .send(submission);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('jobId', 'job-123');
        });

        it('should return 400 if fields are missing', async () => {
            const res = await request(app).post('/api/submit').send({});
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /api/result/:jobId', () => {
        it('should return the state and result of a job', async () => {
            const res = await request(app).get('/api/result/job-123');
            expect(res.statusCode).toEqual(200);
            expect(res.body.state).toBe('completed');
        });
    });

    // FIXED TEST BLOCK
    describe('POST /api/questions', () => {
        it('should create a new question successfully', async () => {
            const dynamicId = `test-q-${Date.now()}`; // Avoids duplicate ID error
            const newQ = {
                id: dynamicId,
                title: "Test Question",
                description: "This is a test",
                boilerplate: "print('hello')", // Matches server.js validation
                testCases: { 
                    sample: [], 
                    hidden: [] 
                }
            };

            const res = await request(app)
                .post('/api/questions')
                .send(newQ);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.id).toBe(dynamicId);
        });
    });
});