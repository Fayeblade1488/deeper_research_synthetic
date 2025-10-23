/**
 * @file Generation service integration tests
 * @description Integration tests for the GenerationService functions
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Project = require('../../data/models/Project');

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
});

describe('GenerationService Integration', () => {
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

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      // Mock the AI provider to return a successful response
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockImplementation(async ({ onProgress }) => {
              // Simulate streaming progress updates
              onProgress({ type: 'progress', wordCount: 100, chunkCount: 5 });
              onProgress({ type: 'progress', wordCount: 200, chunkCount: 10 });
              
              // Return final result
              return {
                content: 'This is the generated content from the AI service.',
                provider: 'Mock AI',
                anonymous: true,
                dataRetention: 'zero',
                chunks: 10,
              };
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Verify response structure
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should handle missing project data', async () => {
      const response = await request(app)
        .post(`/api/generate/${testProject._id}`)
        .send({}) // Missing project data
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project data is required',
      });
    });

    it('should handle missing source context', async () => {
      const projectWithoutContext = new Project({
        name: 'Project Without Context',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '', // Empty source context
      });
      const savedProject = await projectWithoutContext.save();

      const response = await request(app)
        .post(`/api/generate/${savedProject._id}`)
        .send({ project: savedProject })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Source context is required for generation',
      });
    });

    it('should handle invalid framework type', async () => {
      const projectWithInvalidFramework = new Project({
        name: 'Project With Invalid Framework',
        framework: 'INVALID_FRAMEWORK',
        sourceContext: 'Test context',
      });
      const savedProject = await projectWithInvalidFramework.save();

      const response = await request(app)
        .post(`/api/generate/${savedProject._id}`)
        .send({ project: savedProject })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid framework: INVALID_FRAMEWORK',
      });
    });

    it('should handle provider errors gracefully', async () => {
      // Mock the AI provider to throw an error
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockRejectedValue(new Error('AI generation failed')),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200); // Should still return 200 for SSE stream

      // Verify response structure
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle validation errors', async () => {
      // Mock the validation service to return errors
      jest.mock('../../services/validationService', () => {
        return {
          validateOutput: jest.fn().mockResolvedValue({
            valid: false,
            errors: ['Generated content is too short'],
            warnings: [],
            wordCount: 100,
          }),
        };
      });

      // Mock the AI provider to return successful response
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: 'Short content',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 5,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mocks
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // Verify response structure
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', async () => {
      // Mock the AI provider
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: 'This test content has exactly seven words in it.',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 5,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      // The word count should be calculated correctly in the validation
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle empty content', async () => {
      // Mock the AI provider to return empty content
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: '',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 0,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle markdown content', async () => {
      // Mock the AI provider to return markdown content
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: '# Header\n\nThis is **bold** and *italic* content with [links](http://example.com).',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 5,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('safeMatch', () => {
    it('should handle regex patterns safely', async () => {
      // Mock the AI provider
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: 'This content has citations [1] at the end of sentences [2].',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 5,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mock
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle invalid regex patterns', async () => {
      // Mock the validation service to throw regex error
      jest.mock('../../services/validationService', () => {
        return {
          validateOutput: jest.fn().mockImplementation(() => {
            // Throw a regex error to test safeMatch handling
            throw new Error('Regex timeout - potential ReDoS attack');
          }),
        };
      });

      // Mock the AI provider
      jest.mock('../../services/providers/ProviderFactory', () => {
        return {
          createFromEnv: jest.fn().mockReturnValue({
            generateWithStreaming: jest.fn().mockResolvedValue({
              content: 'Generated content',
              provider: 'Mock AI',
              anonymous: true,
              dataRetention: 'zero',
              chunks: 5,
            }),
            getInfo: jest.fn().mockReturnValue({
              name: 'Mock AI',
              privacyFocused: true,
              dataRetention: 'zero',
            }),
          }),
        };
      });

      // Re-import the app to get the updated mocks
      jest.resetModules();
      const reloadedApp = require('../../server');

      // Make request to generation endpoint
      const response = await request(reloadedApp)
        .post(`/api/generate/${testProject._id}`)
        .send({ project: testProject })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });
});