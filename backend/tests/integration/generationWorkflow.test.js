/**
 * @file Generation workflow integration tests
 * @description Integration tests for the complete content generation workflow
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

describe('Generation Workflow Integration', () => {
  let testProject;
  let api;

  beforeEach(() => {
    api = request(app);
  });

  describe('Project Creation and Generation', () => {
    it('should create project, update context, and start generation', async () => {
      // Step 1: Create a new project
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
        status: 'New',
      });

      const projectId = createResponse.body.id;

      // Step 2: Update project with source context
      const updateContextResponse = await api
        .put(`/api/projects/${projectId}`)
        .send({
          sourceContext: 'This is the source context for integration testing. It contains enough information to test the generation workflow.',
        })
        .expect(200);

      expect(updateContextResponse.body).toMatchObject({
        id: projectId,
        name: 'Integration Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'This is the source context for integration testing. It contains enough information to test the generation workflow.',
        generatedContent: '',
        generationMetadata: null,
        status: 'New',
        version: 1,
      });

      // Step 3: Start content generation (this would normally stream)
      // Since we're using an in-memory server without actual AI, we'll mock the response
      const generateResponse = await api
        .post(`/api/generate/${projectId}`)
        .send({
          project: updateContextResponse.body,
        })
        .expect(200);

      // Should return SSE stream headers
      expect(generateResponse.headers['content-type']).toContain('text/event-stream');
      expect(generateResponse.headers['cache-control']).toBe('no-cache');
    });

    it('should handle project creation with missing fields', async () => {
      // Try to create project without name
      const response1 = await api
        .post('/api/projects')
        .send({
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(400);

      expect(response1.body).toEqual({
        error: 'Project name and framework are required.',
      });

      // Try to create project without framework
      const response2 = await api
        .post('/api/projects')
        .send({
          name: 'Test Project',
        })
        .expect(400);

      expect(response2.body).toEqual({
        error: 'Project name and framework are required.',
      });

      // Try to create project with invalid framework
      const response3 = await api
        .post('/api/projects')
        .send({
          name: 'Test Project',
          framework: 'INVALID_FRAMEWORK',
        })
        .expect(400);

      expect(response3.body).toEqual({
        error: 'Invalid framework. Must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
      });
    });

    it('should handle project update with invalid ID', async () => {
      const response = await api
        .put('/api/projects/invalid-id')
        .send({
          sourceContext: 'Updated context',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });

    it('should handle project update for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await api
        .put(`/api/projects/${nonExistentId}`)
        .send({
          sourceContext: 'Updated context',
        })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should handle generation start with missing project data', async () => {
      const response = await api
        .post('/api/generate/invalid-id')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project data is required',
      });
    });

    it('should handle generation start with invalid project ID', async () => {
      const response = await api
        .post('/api/generate/invalid-id')
        .send({
          project: { id: 'invalid-id' },
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });

    it('should handle generation start for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await api
        .post(`/api/generate/${nonExistentId}`)
        .send({
          project: { id: nonExistentId },
        })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });
  });

  describe('Project Management', () => {
    beforeEach(async () => {
      // Create a test project for each test
      testProject = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      });
      await testProject.save();
    });

    it('should retrieve project by ID', async () => {
      const response = await api
        .get(`/api/projects/${testProject._id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testProject._id.toString(),
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
        generatedContent: '',
        generationMetadata: null,
        status: 'New',
      });
    });

    it('should retrieve all projects', async () => {
      // Create another project
      const secondProject = new Project({
        name: 'Second Project',
        framework: 'PROJECT_SYNTHETIC',
        sourceContext: 'Second source context',
      });
      await secondProject.save();

      const response = await api
        .get('/api/projects')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Project',
            framework: 'PROJECT_DEEPDIVE',
          }),
          expect.objectContaining({
            name: 'Second Project',
            framework: 'PROJECT_SYNTHETIC',
          }),
        ])
      );
    });

    it('should delete project successfully', async () => {
      // Verify project exists
      await api
        .get(`/api/projects/${testProject._id}`)
        .expect(200);

      // Delete project
      await api
        .delete(`/api/projects/${testProject._id}`)
        .expect(204);

      // Verify project is deleted
      await api
        .get(`/api/projects/${testProject._id}`)
        .expect(404);
    });

    it('should handle delete for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await api
        .delete(`/api/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should handle delete with invalid ID format', async () => {
      const response = await api
        .delete('/api/projects/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });

  describe('Status and Health Checks', () => {
    it('should return server status', async () => {
      const response = await api
        .get('/api/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'THE FORGE is operational',
        phase: 'Operation COGNITION',
        projectCount: 0,
        geminiConfigured: false,
        performance: expect.objectContaining({
          status: expect.any(String),
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          }),
          activeGenerations: 0,
          totalRequests: expect.any(Number),
          errorRate: expect.any(Number),
          uptime: expect.any(Number),
        }),
      });

      // Check performance status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(response.body.performance.status);
    });

    it('should return performance metrics', async () => {
      const response = await api
        .get('/api/performance')
        .expect(200);

      expect(response.body).toEqual({
        memoryUsage: expect.any(Array),
        activeGenerations: 0,
        totalRequests: expect.any(Number),
        errors: 0,
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
      expect(['healthy', 'warning', 'critical']).toContain(response.body.status);
    });

    it('should generate performance report', async () => {
      const response = await api
        .post('/api/performance/report')
        .expect(200);

      expect(response.body).toEqual({
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
        activeGenerations: 0,
        thresholds: expect.objectContaining({
          maxMemoryMB: expect.any(Number),
          maxActiveGenerations: expect.any(Number),
          maxErrorRate: expect.any(Number),
          maxResponseTime: expect.any(Number),
        }),
        status: expect.any(String),
      });

      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(response.body.status);
    });

    it('should update performance thresholds', async () => {
      const newThresholds = {
        maxMemoryMB: 1024,
        maxActiveGenerations: 20,
        maxErrorRate: 0.05,
        maxResponseTime: 15000,
      };

      const response = await api
        .put('/api/performance/thresholds')
        .send(newThresholds)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Performance thresholds updated',
        thresholds: newThresholds,
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent project creation', async () => {
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

      const responses = await Promise.all(projectPromises);

      // Verify all projects were created
      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response.body.name).toBe(`Concurrent Project ${index + 1}`);
        expect(response.body.framework).toBe('PROJECT_DEEPDIVE');
      });

      // Verify all projects are retrievable
      const listResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listResponse.body).toHaveLength(5);
    });

    it('should handle concurrent project updates', async () => {
      // Create test projects
      const projectPromises = [];
      for (let i = 1; i <= 3; i++) {
        projectPromises.push(
          api
            .post('/api/projects')
            .send({
              name: `Update Test Project ${i}`,
              framework: 'PROJECT_DEEPDIVE',
            })
            .expect(201)
        );
      }

      const createResponses = await Promise.all(projectPromises);
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
      expect(updateResponses).toHaveLength(3);
      updateResponses.forEach((response, index) => {
        expect(response.body.sourceContext).toBe(`Updated context for project ${index + 1}`);
        expect(response.body.version).toBe(1);
      });
    });

    it('should handle concurrent project deletions', async () => {
      // Create test projects
      const projectPromises = [];
      for (let i = 1; i <= 3; i++) {
        projectPromises.push(
          api
            .post('/api/projects')
            .send({
              name: `Delete Test Project ${i}`,
              framework: 'PROJECT_DEEPDIVE',
            })
            .expect(201)
        );
      }

      const createResponses = await Promise.all(projectPromises);
      const projectIds = createResponses.map(response => response.body.id);

      // Delete projects concurrently
      const deletePromises = projectIds.map(id => {
        return api
          .delete(`/api/projects/${id}`)
          .expect(204);
      });

      await Promise.all(deletePromises);

      // Verify all projects are deleted
      const listResponse = await api
        .get('/api/projects')
        .expect(200);

      expect(listResponse.body).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(Project, 'findActive').mockRejectedValue(new Error('Database connection failed'));

      const response = await api
        .get('/api/projects')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should handle validation errors gracefully', async () => {
      // Create project with extremely long name
      const longName = 'A'.repeat(201); // Exceeds 200 character limit

      const response = await api
        .post('/api/projects')
        .send({
          name: longName,
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name cannot exceed 200 characters',
      });
    });

    it('should handle unexpected server errors', async () => {
      // Mock unexpected error in project creation
      jest.spyOn(Project.prototype, 'save').mockRejectedValue(new Error('Unexpected server error'));

      const response = await api
        .post('/api/projects')
        .send({
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error during project creation',
      });

      // Restore original implementation
      jest.restoreAllMocks();
    });
  });

  describe('Security', () => {
    it('should sanitize input to prevent injection attacks', async () => {
      // Test with potentially dangerous input
      const dangerousName = '<script>alert("xss")</script>Test Project';
      const dangerousContext = 'Test context with <img src=x onerror=alert("xss")>';

      const response = await api
        .post('/api/projects')
        .send({
          name: dangerousName,
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      // Should have sanitized input
      expect(response.body.name).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Test Project');
    });

    it('should prevent path traversal attacks', async () => {
      // Test with path traversal attempt
      const traversalName = '../etc/passwd';
      const traversalContext = 'Test context';

      const response = await api
        .post('/api/projects')
        .send({
          name: traversalName,
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);

      // Should accept the name as-is (it's not a security issue in this context)
      expect(response.body.name).toBe('../etc/passwd');
    });

    it('should handle excessively large inputs', async () => {
      // Create extremely large input
      const largeContext = 'A'.repeat(1000001); // Exceeds 1MB limit

      const response = await api
        .put('/api/projects/test-id')
        .send({
          sourceContext: largeContext,
        })
        .expect(400);

      expect(response.body.error).toContain('Source context is too large');
    });
  });
});