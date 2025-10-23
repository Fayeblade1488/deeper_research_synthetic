/**
 * @file API endpoints integration tests
 * @description Integration tests for all backend API endpoints
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

describe('API Endpoints', () => {
  describe('GET /api/status', () => {
    it('should return server status successfully', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'THE FORGE is operational',
        phase: 'Operation COGNITION',
        projectCount: 0,
        geminiConfigured: false,
        performance: {
          status: expect.any(String),
          memory: {
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          },
          activeGenerations: 0,
          totalRequests: expect.any(Number),
          errorRate: expect.any(Number),
          uptime: expect.any(Number),
        },
      });
      
      // Check performance status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(response.body.performance.status);
    });
  });

  describe('GET /api/performance', () => {
    it('should return performance metrics successfully', async () => {
      const response = await request(app)
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
        currentMemory: {
          rss: expect.any(Number),
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        },
        uptime: expect.any(Number),
        status: expect.any(String),
      });
      
      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(response.body.status);
    });
  });

  describe('POST /api/performance/report', () => {
    it('should generate performance report successfully', async () => {
      const response = await request(app)
        .post('/api/performance/report')
        .expect(200);

      expect(response.body).toEqual({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: {
          current: {
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          },
          peak: expect.any(Number),
          averageGrowth: expect.any(Number),
        },
        requests: {
          total: expect.any(Number),
          errors: expect.any(Number),
          errorRate: expect.any(Number),
          averageResponseTime: expect.any(Number),
        },
        activeGenerations: 0,
        thresholds: {
          maxMemoryMB: 512,
          maxActiveGenerations: 10,
          maxErrorRate: 0.1,
          maxResponseTime: 30000,
        },
        status: expect.any(String),
      });
      
      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(response.body.status);
    });
  });

  describe('PUT /api/performance/thresholds', () => {
    it('should update performance thresholds successfully', async () => {
      const newThresholds = {
        maxMemoryMB: 1024,
        maxActiveGenerations: 20,
        maxErrorRate: 0.05,
        maxResponseTime: 15000,
      };

      const response = await request(app)
        .put('/api/performance/thresholds')
        .send(newThresholds)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Performance thresholds updated',
        thresholds: newThresholds,
      });
    });

    it('should handle invalid threshold values', async () => {
      const invalidThresholds = {
        maxMemoryMB: -1, // Invalid negative value
      };

      const response = await request(app)
        .put('/api/performance/thresholds')
        .send(invalidThresholds)
        .expect(200); // Should still succeed but with default values for invalid ones

      expect(response.body.message).toBe('Performance thresholds updated');
    });
  });

  describe('GET /api/projects', () => {
    it('should return empty array when no projects exist', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all active projects', async () => {
      // Create test projects
      const project1 = new Project({
        name: 'Project 1',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Context 1',
      });
      await project1.save();

      const project2 = new Project({
        name: 'Project 2',
        framework: 'PROJECT_SYNTHETIC',
        sourceContext: 'Context 2',
      });
      await project2.save();

      // Create a deleted project
      const deletedProject = new Project({
        name: 'Deleted Project',
        framework: 'PROJECT_BENCHMARK',
        sourceContext: 'Deleted Context',
      });
      const savedDeletedProject = await deletedProject.save();
      await savedDeletedProject.softDelete();

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].name).toBe('Project 2'); // Most recent first
      expect(response.body[1].name).toBe('Project 1');
      
      // Ensure deleted project is not included
      expect(response.body.some(p => p.name === 'Deleted Project')).toBe(false);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'New Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'New Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        status: 'New',
        version: 0,
      });

      // Verify dates are valid ISO strings
      expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
      
      // Verify project was saved to database
      const savedProject = await Project.findById(response.body.id);
      expect(savedProject).not.toBeNull();
      expect(savedProject.name).toBe('New Project');
      expect(savedProject.framework).toBe('PROJECT_DEEPDIVE');
    });

    it('should return 400 for missing project name', async () => {
      const projectData = {
        framework: 'PROJECT_DEEPDIVE',
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name and framework are required.',
      });
    });

    it('should return 400 for missing framework', async () => {
      const projectData = {
        name: 'New Project',
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name and framework are required.',
      });
    });

    it('should return 400 for invalid framework', async () => {
      const projectData = {
        name: 'New Project',
        framework: 'INVALID_FRAMEWORK',
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid framework. Must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
      });
    });

    it('should handle project name validation', async () => {
      const longName = 'A'.repeat(201); // Exceeds 200 character limit
      const projectData = {
        name: longName,
        framework: 'PROJECT_DEEPDIVE',
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Project name cannot exceed 200 characters',
      });
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project by ID successfully', async () => {
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
      });
      const savedProject = await project.save();

      const response = await request(app)
        .get(`/api/projects/${savedProject._id}`)
        .expect(200);

      expect(response.body).toEqual({
        id: savedProject._id.toString(),
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: savedProject.createdAt.toISOString(),
        updatedAt: savedProject.updatedAt.toISOString(),
        status: 'New',
        version: 0,
      });
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should return 404 for deleted project', async () => {
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();
      await savedProject.softDelete();

      const response = await request(app)
        .get(`/api/projects/${savedProject._id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project successfully', async () => {
      const project = new Project({
        name: 'Original Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Original context',
      });
      const savedProject = await project.save();

      const updateData = {
        name: 'Updated Project',
        sourceContext: 'Updated context',
        status: 'In Progress',
      };

      const response = await request(app)
        .put(`/api/projects/${savedProject._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        id: savedProject._id.toString(),
        name: 'Updated Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Updated context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: savedProject.createdAt.toISOString(),
        updatedAt: expect.any(String),
        status: 'In Progress',
        version: 1, // Version incremented
      });

      // Verify project was updated in database
      const updatedProject = await Project.findById(savedProject._id);
      expect(updatedProject.name).toBe('Updated Project');
      expect(updatedProject.sourceContext).toBe('Updated context');
      expect(updatedProject.status).toBe('In Progress');
      expect(updatedProject.version).toBe(1);
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Project' };

      const response = await request(app)
        .put(`/api/projects/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const updateData = { name: 'Updated Project' };

      const response = await request(app)
        .put('/api/projects/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });

    it('should handle optimistic locking with version', async () => {
      const project = new Project({
        name: 'Original Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      // Update project with correct version
      const updateData = { 
        name: 'Updated Project',
        version: 0 // Expected version
      };

      const response = await request(app)
        .put(`/api/projects/${savedProject._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.version).toBe(1);

      // Try to update with wrong version (should fail)
      const updateWithWrongVersion = { 
        name: 'Another Update',
        version: 0 // Wrong version (should be 1 now)
      };

      await request(app)
        .put(`/api/projects/${savedProject._id}`)
        .send(updateWithWrongVersion)
        .expect(409); // Conflict
    });

    it('should sanitize update data to prevent forbidden field changes', async () => {
      const project = new Project({
        name: 'Original Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      const updateData = {
        name: 'Updated Project',
        id: 'different-id', // Should be ignored
        createdAt: new Date('2020-01-01'), // Should be ignored
        __v: 100, // Should be ignored
      };

      const response = await request(app)
        .put(`/api/projects/${savedProject._id}`)
        .send(updateData)
        .expect(200);

      // Check that forbidden fields were not changed
      expect(response.body.id).toBe(savedProject._id.toString());
      expect(response.body.createdAt).toBe(savedProject.createdAt.toISOString());
      expect(response.body.__v).toBe(0);
      expect(response.body.name).toBe('Updated Project');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project successfully (soft delete)', async () => {
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      await request(app)
        .delete(`/api/projects/${savedProject._id}`)
        .expect(204);

      // Verify project is soft deleted
      const deletedProject = await Project.findById(savedProject._id);
      expect(deletedProject).not.toBeNull();
      expect(deletedProject.deletedAt).not.toBeNull();

      // Verify project is not returned in GET requests
      await request(app)
        .get(`/api/projects/${savedProject._id}`)
        .expect(404);
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Project not found.',
      });
    });

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .delete('/api/projects/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid project ID format',
      });
    });
  });
});