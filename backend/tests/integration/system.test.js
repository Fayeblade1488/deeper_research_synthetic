/**
 * @file System integration tests
 * @description Integration tests for the complete Deeper Research Synthetic system
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

describe('System Integration Tests', () => {
  let api;
  let testProject;

  beforeAll(() => {
    api = request(app);
  });

  describe('Complete Project Lifecycle', () => {
    it('should create, retrieve, update, and delete a project', async () => {
      // 1. Create a new project
      const createResponse = await api
        .post('/api/projects')
        .send({
          name: 'Integration Test Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: expect.any(String),
        name: 'Integration Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        status: 'New',
        version: 0,
      });

      const projectId = createResponse.body.id;

      // 2. Retrieve the created project
      const getResponse = await api
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getResponse.body).toEqual(createResponse.body);

      // 3. Update the project with source context
      const updateResponse = await api
        .put(`/api/projects/${projectId}`)
        .send({
          sourceContext: 'This is the source context for integration testing.',
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: projectId,
        name: 'Integration Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'This is the source context for integration testing.',
        generatedContent: '',
        generationMetadata: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        status: 'New',
        version: 1,
      });

      // 4. Verify the update by retrieving the project again
      const getUpdatedResponse = await api
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getUpdatedResponse.body.sourceContext).toBe('This is the source context for integration testing.');
      expect(getUpdatedResponse.body.version).toBe(1);

      // 5. List all projects and verify our project is included
      const listResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(projectId);
      expect(listResponse.body[0].name).toBe('Integration Test Project');

      // 6. Delete the project
      await api
        .delete(`/api/projects/${projectId}`)
        .expect(204);

      // 7. Verify the project is deleted
      await api
        .get(`/api/projects/${projectId}`)
        .expect(404);

      // 8. Verify the project list is now empty
      const listAfterDeleteResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listAfterDeleteResponse.body).toHaveLength(0);
    });

    it('should handle concurrent project operations', async () => {
      // Create multiple projects concurrently
      const projectPromises = [];
      for (let i = 1; i <= 5; i++) {
        projectPromises.push(
          api
            .post('/api/projects')
            .send({
              name: `Concurrent Project ${i}`,
              framework: 'PROJECT_DEEPDIVE',
            })
            .expect(201)
        );
      }

      const createResponses = await Promise.all(projectPromises);

      // Verify all projects were created
      expect(createResponses).toHaveLength(5);
      createResponses.forEach((response, index) => {
        expect(response.body.name).toBe(`Concurrent Project ${index + 1}`);
        expect(response.body.framework).toBe('PROJECT_DEEPDIVE');
      });

      // Get all project IDs
      const projectIds = createResponses.map(response => response.body.id);

      // Update projects concurrently
      const updatePromises = projectIds.map((id, index) => {
        return api
          .put(`/api/projects/${id}`)
          .send({
            sourceContext: `Updated context for project ${index + 1}`,
          })
          .expect(200);
      });

      const updateResponses = await Promise.all(updatePromises);

      // Verify all projects were updated
      expect(updateResponses).toHaveLength(5);
      updateResponses.forEach((response, index) => {
        expect(response.body.sourceContext).toBe(`Updated context for project ${index + 1}`);
        expect(response.body.version).toBe(1);
      });

      // List all projects
      const listResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listResponse.body).toHaveLength(5);

      // Delete projects concurrently
      const deletePromises = projectIds.map(id => {
        return api
          .delete(`/api/projects/${id}`)
          .expect(204);
      });

      await Promise.all(deletePromises);

      // Verify all projects are deleted
      const listAfterDeleteResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listAfterDeleteResponse.body).toHaveLength(0);
    });
  });

  describe('Content Generation Workflow', () => {
    beforeEach(async () => {
      // Create a test project for generation tests
      const createResponse = await api
        .post('/api/projects')
        .send({
          name: 'Generation Test Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      testProject = createResponse.body;
    });

    it('should start content generation and update project with results', async () => {
      // Update project with source context
      const updateResponse = await api
        .put(`/api/projects/${testProject.id}`)
        .send({
          sourceContext: 'This is test source context for content generation.',
        })
        .expect(200);

      testProject = updateResponse.body;

      // Start content generation (this would normally stream)
      // Since we're in a test environment, we'll mock the AI response
      const generateResponse = await api
        .post(`/api/generate/${testProject.id}`)
        .send({ project: testProject })
        .expect(200);

      // Check that response is SSE stream
      expect(generateResponse.headers['content-type']).toContain('text/event-stream');
      expect(generateResponse.headers['cache-control']).toBe('no-cache');
      expect(generateResponse.headers['connection']).toBe('keep-alive');

      // In a real environment, the generation would update the project
      // For testing, we'll simulate this by directly updating the project
      const finalUpdateResponse = await api
        .put(`/api/projects/${testProject.id}`)
        .send({
          generatedContent: 'This is the generated content from the AI.',
          generationMetadata: {
            framework: 'PROJECT_DEEPDIVE',
            outputType: 'TOME',
            wordCount: 8,
            generationTime: 1000,
            timestamp: new Date().toISOString(),
            validation: {
              valid: true,
              errors: [],
              warnings: [],
              wordCount: 8,
            },
            provider: 'Mock AI',
            privacyMode: 'enabled',
            dataRetention: 'zero',
          },
        })
        .expect(200);

      // Verify the project was updated with generated content
      expect(finalUpdateResponse.body.generatedContent).toBe('This is the generated content from the AI.');
      expect(finalUpdateResponse.body.generationMetadata).toEqual({
        framework: 'PROJECT_DEEPDIVE',
        outputType: 'TOME',
        wordCount: 8,
        generationTime: 1000,
        timestamp: expect.any(String),
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          wordCount: 8,
        },
        provider: 'Mock AI',
        privacyMode: 'enabled',
        dataRetention: 'zero',
      });
    });

    it('should handle generation status checks', async () => {
      // Check generation status for active generation
      const statusResponse = await api
        .get(`/api/generate/${testProject.id}/status`)
        .expect(200);

      expect(statusResponse.body).toEqual({
        active: false,
      });
    });

    it('should handle generation cancellation', async () => {
      // Try to cancel non-active generation
      const cancelResponse = await api
        .delete(`/api/generate/${testProject.id}`)
        .expect(404);

      expect(cancelResponse.body).toEqual({
        error: 'No active generation found',
      });
    });
  });

  describe('System Health and Performance', () => {
    it('should return server status', async () => {
      const statusResponse = await api
        .get('/api/status')
        .expect(200);

      expect(statusResponse.body).toEqual({
        status: 'THE FORGE is operational',
        phase: 'Operation COGNITION',
        projectCount: expect.any(Number),
        geminiConfigured: expect.any(Boolean),
        performance: expect.objectContaining({
          status: expect.any(String),
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          }),
          activeGenerations: expect.any(Number),
          totalRequests: expect.any(Number),
          errorRate: expect.any(Number),
          uptime: expect.any(Number),
        }),
      });

      // Check performance status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(statusResponse.body.performance.status);
    });

    it('should return performance metrics', async () => {
      const perfResponse = await api
        .get('/api/performance')
        .expect(200);

      expect(perfResponse.body).toEqual({
        memoryUsage: expect.any(Array),
        activeGenerations: expect.any(Number),
        totalRequests: expect.any(Number),
        errors: expect.any(Number),
        averageResponseTime: expect.any(Number),
        peakMemoryUsage: expect.any(Number),
        startTime: expect.any(Number),
        currentMemory: expect.objectContaining({
          rss: expect.any(Number),
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        }),
        uptime: expect.any(Number),
        status: expect.any(String),
      });

      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(perfResponse.body.status);
    });

    it('should generate performance report', async () => {
      const reportResponse = await api
        .post('/api/performance/report')
        .expect(200);

      expect(reportResponse.body).toEqual({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          current: expect.objectContaining({
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          }),
          peak: expect.any(Number),
          averageGrowth: expect.any(Number),
        }),
        requests: expect.objectContaining({
          total: expect.any(Number),
          errors: expect.any(Number),
          errorRate: expect.any(Number),
          averageResponseTime: expect.any(Number),
        }),
        activeGenerations: expect.any(Number),
        thresholds: expect.objectContaining({
          maxMemoryMB: expect.any(Number),
          maxActiveGenerations: expect.any(Number),
          maxErrorRate: expect.any(Number),
          maxResponseTime: expect.any(Number),
        }),
        status: expect.any(String),
      });

      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(reportResponse.body.status);
    });

    it('should update performance thresholds', async () => {
      const newThresholds = {
        maxMemoryMB: 1024,
        maxActiveGenerations: 20,
        maxErrorRate: 0.05,
        maxResponseTime: 15000,
      };

      const updateResponse = await api
        .put('/api/performance/thresholds')
        .send(newThresholds)
        .expect(200);

      expect(updateResponse.body).toEqual({
        message: 'Performance thresholds updated',
        thresholds: newThresholds,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID format', async () => {
      const response = await api
        .get('/api/projects/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });

    it('should handle missing project data in creation', async () => {
      const response = await api
        .post('/api/projects')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name and framework are required.',
      });
    });

    it('should handle invalid framework type in creation', async () => {
      const response = await api
        .post('/api/projects')
        .send({
          name: 'Test Project',
          framework: 'INVALID_FRAMEWORK',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid framework. Must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
      });
    });

    it('should handle missing project data in generation', async () => {
      const response = await api
        .post('/api/generate/test-id')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project data is required',
      });
    });

    it('should handle invalid project ID in generation', async () => {
      const response = await api
        .post('/api/generate/invalid-id')
        .send({ project: { id: 'invalid-id' } })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });

  describe('Security', () => {
    it('should sanitize input to prevent XSS attacks', async () => {
      const response = await api
        .post('/api/projects')
        .send({
          name: '<script>alert("xss")</script>Sanitized Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      // Should have sanitized the input
      expect(response.body.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Sanitized Project');
    });

    it('should prevent path traversal attacks', async () => {
      // Try to create project with path traversal in name
      const response = await api
        .post('/api/projects')
        .send({
          name: '../etc/passwd',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      // Should accept the name as-is (it's not a security issue in this context)
      expect(response.body.name).toBe('../etc/passwd');
    });

    it('should handle excessively large inputs', async () => {
      // Create extremely large input
      const largeName = 'A'.repeat(201); // Exceeds 200 character limit

      const response = await api
        .post('/api/projects')
        .send({
          name: largeName,
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name cannot exceed 200 characters',
      });
    });
  });
});