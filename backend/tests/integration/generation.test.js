/**
 * @file Generation endpoints integration tests
 * @description Integration tests for the content generation API endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Project = require('../../data/models/Project');
const { performanceMonitor } = require('../../services/performanceService');

// Mock the AI provider service to prevent actual API calls
jest.mock('../../services/providers/ProviderFactory');

// Global variables for MongoDB memory server
let mongoServer;

/**
 * Connect to the in-memory database before running tests
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

/**
 * Disconnect from the in-memory database after running tests
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

/**
 * Clear the database after each test
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Reset performance monitor
  performanceMonitor.reset();
  
  // Clear all mocks
  jest.clearAllMocks();
});

describe('Generation Endpoints', () => {
  let testProject;

  // Create a test project before each test
  beforeEach(async () => {
    testProject = new Project({
      name: 'Test Project',
      framework: 'PROJECT_DEEPDIVE',
      sourceContext: 'This is test source context for generation.',
    });
    await testProject.save();
  });

  describe('POST /api/generate/:id', () => {
    it('should start generation successfully with SSE streaming', async () => {
      // Mock the AI provider
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(async ({ onProgress }) => {
          // Simulate progress updates
          onProgress({ type: 'progress', wordCount: 100, chunkCount: 5 });
          onProgress({ type: 'progress', wordCount: 200, chunkCount: 10 });
          
          // Return final result
          return {
            content: 'Generated content from AI',
            metadata: {
              wordCount: 4,
              generationTime: 1000,
              provider: 'Mock AI',
              privacyMode: 'enabled',
              dataRetention: 'zero',
            },
          };
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation request
      const response = await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Check that response is SSE stream
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');

      // Verify provider was called correctly
      expect(ProviderFactory.createFromEnv).toHaveBeenCalled();
      expect(mockProvider.generateWithStreaming).toHaveBeenCalledWith({
        prompt: expect.any(String),
        onProgress: expect.any(Function),
        context: [],
      });

      // Verify performance monitor was updated
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.activeGenerations).toBe(0); // Should be 0 after completion
      expect(metrics.totalRequests).toBeGreaterThan(0);
    });

    it('should return 400 for missing project data', async () => {
      const response = await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({}) // Missing project data
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project data is required',
      });
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/generate/${nonExistentId}`)
        .send({ project: { id: nonExistentId } })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .post('/api/generate/invalid-id')
        .send({ project: { id: 'invalid-id' } })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });

    it('should return 409 for concurrent generation attempts', async () => {
      // Mock the AI provider to simulate a long-running generation
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            // Simulate long-running generation
            setTimeout(() => {
              resolve({
                content: 'Generated content',
                metadata: { wordCount: 2 },
              });
            }, 1000);
          });
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start first generation request
      const firstRequest = request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject });

      // Start second generation request (should fail with 409)
      const secondRequest = await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(409);

      expect(secondRequest.body).toEqual({
        error: 'Generation already in progress for this project',
      });

      // Wait for first request to complete
      await firstRequest;
    });

    it('should handle provider errors gracefully', async () => {
      // Mock the AI provider to throw an error
      const mockProvider = {
        generateWithStreaming: jest.fn().mockRejectedValue(new Error('AI generation failed')),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation request
      const response = await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Check that response is SSE stream
      expect(response.headers['content-type']).toContain('text/event-stream');

      // Verify provider was called
      expect(ProviderFactory.createFromEnv).toHaveBeenCalled();
      expect(mockProvider.generateWithStreaming).toHaveBeenCalledWith({
        prompt: expect.any(String),
        onProgress: expect.any(Function),
        context: [],
      });

      // Verify performance monitor recorded the error
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.errors).toBeGreaterThan(0);
    });

    it('should handle missing source context', async () => {
      // Create project without source context
      const projectWithoutContext = new Project({
        name: 'Project Without Context',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '', // Empty source context
      });
      const savedProject = await projectWithoutContext.save();

      // Mock the AI provider
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(async ({ onProgress }) => {
          // Return final result
          return {
            content: 'Generated content',
            metadata: { wordCount: 2 },
          };
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation request
      const response = await request(app)
        .post(`/api/generate/${savedProject._id}`)
        .send({ project: savedProject })
        .expect(200);

      // Check that response is SSE stream
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should validate project framework type', async () => {
      // Create project with invalid framework
      const projectWithInvalidFramework = new Project({
        name: 'Invalid Framework Project',
        framework: 'INVALID_FRAMEWORK',
        sourceContext: 'Test context',
      });
      const savedProject = await projectWithInvalidFramework.save();

      // Mock the AI provider
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(async ({ onProgress }) => {
          // Return final result
          return {
            content: 'Generated content',
            metadata: { wordCount: 2 },
          };
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation request
      const response = await request(app)
        .post(`/api/generate/${savedProject._id}`)
        .send({ project: savedProject })
        .expect(200);

      // Check that response is SSE stream
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('GET /api/generate/:id/status', () => {
    it('should return generation status for active generation', async () => {
      // Mock the AI provider to simulate an active generation
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            // Simulate long-running generation
            setTimeout(() => {
              resolve({
                content: 'Generated content',
                metadata: { wordCount: 2 },
              });
            }, 1000);
          });
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation in background
      const generationRequest = request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject });

      // Wait a bit for generation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check generation status
      const response = await request(app)
        .get(`/api/generate/${testProject._id}/status`)
        .expect(200);

      expect(response.body).toEqual({
        active: true,
        status: expect.any(String),
        startTime: expect.any(Number),
        duration: expect.any(Number),
      });

      // Wait for generation to complete
      await generationRequest;
    });

    it('should return inactive status for completed generation', async () => {
      // Mock the AI provider
      const mockProvider = {
        generateWithStreaming: jest.fn().mockResolvedValue({
          content: 'Generated content',
          metadata: { wordCount: 2 },
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Complete a generation
      await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Check generation status (should be inactive)
      const response = await request(app)
        .get(`/api/generate/${testProject._id}/status`)
        .expect(200);

      expect(response.body).toEqual({
        active: false,
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .get('/api/generate/invalid-id/status')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });

  describe('DELETE /api/generate/:id', () => {
    it('should cancel active generation successfully', async () => {
      // Mock the AI provider to simulate a long-running generation
      const mockProvider = {
        generateWithStreaming: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            // Simulate long-running generation
            setTimeout(() => {
              resolve({
                content: 'Generated content',
                metadata: { wordCount: 2 },
              });
            }, 5000); // Long delay
          });
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Start generation in background
      const generationRequest = request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject });

      // Wait a bit for generation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cancel generation
      const response = await request(app)
        .delete(`/api/generate/${testProject._id}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Generation cancelled',
      });

      // Wait for generation to complete (should be cancelled)
      await generationRequest;
    });

    it('should return 404 for non-active generation', async () => {
      const response = await request(app)
        .delete(`/api/generate/${testProject._id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'No active generation found',
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .delete('/api/generate/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should record generation start and completion', async () => {
      // Mock the AI provider
      const mockProvider = {
        generateWithStreaming: jest.fn().mockResolvedValue({
          content: 'Generated content',
          metadata: { wordCount: 2 },
        }),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Get initial metrics
      const initialMetrics = performanceMonitor.getMetrics();

      // Start generation
      await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Get final metrics
      const finalMetrics = performanceMonitor.getMetrics();

      // Verify metrics were updated
      expect(finalMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
      expect(finalMetrics.activeGenerations).toBe(0); // Should be 0 after completion
    });

    it('should record generation errors', async () => {
      // Mock the AI provider to throw an error
      const mockProvider = {
        generateWithStreaming: jest.fn().mockRejectedValue(new Error('AI generation failed')),
        getInfo: jest.fn().mockReturnValue({
          name: 'Mock AI',
          privacyFocused: true,
          dataRetention: 'zero',
        }),
      };

      const ProviderFactory = require('../../services/providers/ProviderFactory');
      ProviderFactory.createFromEnv.mockReturnValue(mockProvider);

      // Get initial metrics
      const initialMetrics = performanceMonitor.getMetrics();

      // Start generation (should fail)
      await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Get final metrics
      const finalMetrics = performanceMonitor.getMetrics();

      // Verify error was recorded
      expect(finalMetrics.errors).toBe(initialMetrics.errors + 1);
      expect(finalMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
    });
  });
});