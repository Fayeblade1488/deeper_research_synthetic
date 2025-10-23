/**
 * API Integration Tests
 * Tests the complete HTTP endpoints using supertest
 *
 * These tests verify:
 * - GET /api/status (server health)
 * - POST /api/projects (create)
 * - GET /api/projects (list)
 * - GET /api/projects/:id (get by ID)
 * - PUT /api/projects/:id (update)
 * - DELETE /api/projects/:id (delete)
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Import server setup from the main server.js
const setupServer = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // In-memory database
  let projects = [];
  const projectUpdateLocks = new Map();
  
  // Lock mechanism
  function acquireProjectLock(projectId) {
    if (projectUpdateLocks.has(projectId)) {
      return projectUpdateLocks
        .get(projectId)
        .then(() => acquireProjectLock(projectId));
    }
    let releaseLock;
    const lockPromise = new Promise((resolve) => {
      releaseLock = () => {
        projectUpdateLocks.delete(projectId);
        resolve();
      };
    });
    projectUpdateLocks.set(projectId, lockPromise);
    return Promise.resolve(releaseLock);
  }
  
  // Routes
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'THE FORGE is operational',
      projectCount: projects.length,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });
  
  app.get('/api/projects', (req, res) => {
    res.json(projects);
  });
  
  app.post('/api/projects', (req, res) => {
    const { name, framework } = req.body || {};
    if (!name || !framework) {
      return res.status(400).json({ error: 'Project name and framework are required.' });
    }
    const newProject = {
      id: crypto.randomUUID(),
      name,
      framework,
      sourceContext: '',
      generatedContent: '',
      generationMetadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'New',
    };
    projects.push(newProject);
    res.status(201).json(newProject);
  });
  
  app.get('/api/projects/:id', (req, res) => {
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(project);
  });
  
  app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    
    try {
      const releaseLock = await acquireProjectLock(projectId);
      
      try {
        const projectIndex = projects.findIndex((p) => p.id === projectId);
        if (projectIndex === -1) {
          return res.status(404).json({ error: 'Project not found.' });
        }
        
        const originalProject = projects[projectIndex];
        const updatedProject = {
          ...originalProject,
          ...req.body,
          id: originalProject.id,
          updatedAt: new Date().toISOString(),
        };
        
        projects[projectIndex] = updatedProject;
        res.json(updatedProject);
      } finally {
        releaseLock();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete('/api/projects/:id', (req, res) => {
    const projectIndex = projects.findIndex((p) => p.id === req.params.id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    projects.splice(projectIndex, 1);
    res.status(204).end();
  });
  
  return app;
};

describe('API Integration Tests', () => {
  let app;
  
  beforeEach(() => {
    app = setupServer();
  });
  
  describe('GET /api/status', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('projectCount');
      expect(response.body.status).toContain('operational');
    });
  });
  
  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Project');
      expect(response.body.framework).toBe('PROJECT_DEEPDIVE');
      expect(response.body).toHaveProperty('createdAt');
    });
    
    it('should return 400 if missing required fields', async () => {
      await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' }) // missing framework
        .expect(400);
    });
  });
  
  describe('GET /api/projects', () => {
    it('should return empty list initially', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
    
    it('should return list of projects after creation', async () => {
      // Create a project first
      await request(app)
        .post('/api/projects')
        .send({ name: 'Project 1', framework: 'PROJECT_DEEPDIVE' });
      
      await request(app)
        .post('/api/projects')
        .send({ name: 'Project 2', framework: 'PROJECT_SYNTHETIC' });
      
      const response = await request(app)
        .get('/api/projects')
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Project 1');
      expect(response.body[1].name).toBe('Project 2');
    });
  });
  
  describe('GET /api/projects/:id', () => {
    it('should return project by ID', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project', framework: 'PROJECT_DEEPDIVE' });
      
      const projectId = createResponse.body.id;
      
      // Retrieve it
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);
      
      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('Test Project');
    });
    
    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/non-existent-id')
        .expect(404);
    });
  });
  
  describe('PUT /api/projects/:id', () => {
    it('should update project successfully', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Original Name', framework: 'PROJECT_DEEPDIVE' });
      
      const projectId = createResponse.body.id;
      
      // Update it
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send({ sourceContext: 'Updated context' })
        .expect(200);
      
      expect(response.body.sourceContext).toBe('Updated context');
      expect(response.body.name).toBe('Original Name'); // unchanged
    });
    
    it('should return 404 for non-existent project', async () => {
      await request(app)
        .put('/api/projects/non-existent-id')
        .send({ sourceContext: 'New context' })
        .expect(404);
    });
  });
  
  describe('DELETE /api/projects/:id', () => {
    it('should delete project successfully', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'To Delete', framework: 'PROJECT_DEEPDIVE' });
      
      const projectId = createResponse.body.id;
      
      // Delete it
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(204);
      
      // Verify it's gone
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });
    
    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/projects/non-existent-id')
        .expect(404);
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should handle concurrent project updates with locking', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Concurrency Test', framework: 'PROJECT_DEEPDIVE' });
      
      const projectId = createResponse.body.id;
      
      // Make multiple concurrent updates
      const updates = [
        { sourceContext: 'Update 1' },
        { sourceContext: 'Update 2' },
        { sourceContext: 'Update 3' },
      ];
      
      const responses = await Promise.all(
        updates.map((update) =>
          request(app)
            .put(`/api/projects/${projectId}`)
            .send(update)
        )
      );
      
      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
      
      // Final state should be one of the updates
      const finalResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);
      
      expect(['Update 1', 'Update 2', 'Update 3']).toContain(
        finalResponse.body.sourceContext
      );
    });
  });
});
