const request = require('supertest');
const axios = require('axios');

// 1. MOCKING MODULES (Must be defined before requiring the app)
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

// 2. IMPORT THE APP (After mocks are defined)
const app = require('./server'); 

describe('Coding Test Service API Endpoints', () => {
    
    // Test: GET /api/questions
    describe('GET /api/questions', () => {
        it('should return a list of question titles and IDs', async () => {
            const res = await request(app).get('/api/questions');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('id');
                expect(res.body[0]).toHaveProperty('title');
            }
        });
    });

    // Test: GET /api/question/:id
    describe('GET /api/question/:id', () => {
        it('should return 404 for non-existent question', async () => {
            const res = await request(app).get('/api/question/fake-id');
            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toBe('Question not found');
        });

        it('should return a specific question by ID', async () => {
            // "two-sum" is a default ID in questions.json
            const res = await request(app).get('/api/question/two-sum');
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe('two-sum');
        });
    });

    // Test: POST /api/submit (Queue Mocking)
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

    // Test: GET /api/result/:jobId
    describe('GET /api/result/:jobId', () => {
        it('should return the state and result of a job', async () => {
            const res = await request(app).get('/api/result/job-123');
            expect(res.statusCode).toEqual(200);
            expect(res.body.state).toBe('completed');
            expect(res.body.result).toBeDefined();
        });
    });

    // Test: POST /api/questions (Create new question)
    describe('POST /api/questions', () => {
        it('should create a new question successfully', async () => {
            const newQ = {
                id: "unique-test-id",
                title: "Test Question",
                description: "Desc",
                boilerplate: { python: "pass" },
                testCases: { 
                    sample: [], 
                    hidden: [] 
                }
            };
            const res = await request(app)
                .post('/api/questions')
                .send(newQ);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.id).toBe("unique-test-id");
        });
    });
});