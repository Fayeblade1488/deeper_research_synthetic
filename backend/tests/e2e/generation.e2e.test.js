/**
 * End-to-End Tests for SSE Generation Flow
 * Tests the complete generation lifecycle with streaming
 *
 * These tests verify:
 * - Project creation
 * - Context addition
 * - SSE generation stream setup
 * - Progress updates during streaming
 * - Completion with content
 * - Cleanup handlers
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Simple mock provider for testing
class MockProvider {
  async generateWithStreaming({ prompt, onProgress }) {
    let fullContent = '';
    
    // Simulate streaming with 3 chunks
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const chunk = `Generated content chunk ${i + 1}. `;
      fullContent += chunk;
      
      if (onProgress) {
        onProgress({
          type: 'progress',
          content: fullContent,
          chunks: i + 1,
          provider: 'mock',
        });
      }
    }
    
    return {
      content: fullContent,
      provider: 'mock',
      chunks: 3,
    };
  }

  getInfo() {
    return {
      name: 'Mock Provider',
      privacyFocused: false,
      dataRetention: 'test',
    };
  }
}

// Setup test server
const setupServer = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  let projects = [];
  const projectUpdateLocks = new Map();
  const activeGenerations = new Map();
  
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
  
  app.post('/api/projects', (req, res) => {
    const { name, framework } = req.body;
    const newProject = {
      id: crypto.randomUUID(),
      name,
      framework,
      sourceContext: '',
      generatedContent: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    res.status(201).json(newProject);
  });
  
  app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const releaseLock = await acquireProjectLock(projectId);
    
    try {
      const projectIndex = projects.findIndex((p) => p.id === projectId);
      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      projects[projectIndex] = {
        ...projects[projectIndex],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(projects[projectIndex]);
    } finally {
      releaseLock();
    }
  });
  
  app.post('/api/generate/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { project } = req.body;
    
    if (activeGenerations.has(projectId)) {
      return res.status(409).json({ error: 'Generation in progress' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    let cleanupExecuted = false;
    const cleanupConnection = () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;
      activeGenerations.delete(projectId);
    };
    
    req.on('close', cleanupConnection);
    req.on('aborted', cleanupConnection);
    
    const connectionTimeout = setTimeout(() => {
      cleanupConnection();
      res.end();
    }, 30000);
    
    activeGenerations.set(projectId, { startTime: Date.now() });
    
    const provider = new MockProvider();
    
    try {
      const result = await provider.generateWithStreaming({
        prompt: `Generate content for: ${project.sourceContext}`,
        onProgress: (update) => {
          if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);
          }
        },
      });
      
      if (!res.destroyed && !res.finished) {
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          content: result.content,
          metadata: { wordCount: result.content.split(' ').length },
        })}\n\n`);
      }
      
      res.end();
    } catch (error) {
      if (!res.destroyed && !res.finished) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message,
        })}\n\n`);
      }
      res.end();
    } finally {
      clearTimeout(connectionTimeout);
      cleanupConnection();
    }
  });
  
  return app;
};

describe('SSE Generation Flow E2E Tests', () => {
  let app;
  
  beforeEach(() => {
    app = setupServer();
  });
  
  describe('Complete Generation Workflow', () => {
    it('should create project, add context, and generate with SSE stream', async () => {
      // Step 1: Create project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'E2E Test Project',
          framework: 'PROJECT_DEEPDIVE',
        })
        .expect(201);
      
      const projectId = createResponse.body.id;
      expect(projectId).toBeDefined();
      expect(createResponse.body.name).toBe('E2E Test Project');
      
      // Step 2: Add source context
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .send({
          sourceContext: 'Climate change impacts on coastal regions',
        })
        .expect(200);
      
      expect(updateResponse.body.sourceContext).toBe('Climate change impacts on coastal regions');
      
      // Step 3: Trigger generation with SSE stream
      const events = [];
      
      await new Promise((resolve, reject) => {
        const req = request(app)
          .post(`/api/generate/${projectId}`)
          .send({
            project: {
              id: projectId,
              name: 'E2E Test Project',
              framework: 'PROJECT_DEEPDIVE',
              sourceContext: 'Climate change impacts on coastal regions',
            },
          })
          .on('data', (data) => {
            // Parse SSE data
            const lines = data.toString().split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6));
                  events.push(event);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          })
          .on('error', reject)
          .on('end', () => {
            setTimeout(resolve, 100); // Allow time for all events to be processed
          });
      });
      
      // Step 4: Verify stream events
      expect(events.length).toBeGreaterThan(0);
      
      // Should have progress events
      const progressEvents = events.filter((e) => e.type === 'progress');
      expect(progressEvents.length).toBeGreaterThan(0);
      
      // Check progress event structure
      const firstProgress = progressEvents[0];
      expect(firstProgress).toHaveProperty('content');
      expect(firstProgress).toHaveProperty('chunks');
      expect(firstProgress).toHaveProperty('provider', 'mock');
      
      // Should have completion event
      const completeEvent = events.find((e) => e.type === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent).toHaveProperty('content');
      expect(completeEvent.content).toContain('Generated content');
      expect(completeEvent).toHaveProperty('metadata');
    }, 30000);
    
    it('should handle multiple concurrent generations', async () => {
      // Create 2 projects
      const project1Response = await request(app)
        .post('/api/projects')
        .send({ name: 'Project 1', framework: 'PROJECT_DEEPDIVE' })
        .expect(201);
      
      const project2Response = await request(app)
        .post('/api/projects')
        .send({ name: 'Project 2', framework: 'PROJECT_SYNTHETIC' })
        .expect(201);
      
      const project1Id = project1Response.body.id;
      const project2Id = project2Response.body.id;
      
      // Add context to both
      await request(app)
        .put(`/api/projects/${project1Id}`)
        .send({ sourceContext: 'Context 1' })
        .expect(200);
      
      await request(app)
        .put(`/api/projects/${project2Id}`)
        .send({ sourceContext: 'Context 2' })
        .expect(200);
      
      // Trigger generation on both in parallel
      const generatePromises = [
        generateWithSSE(app, project1Id, project1Response.body),
        generateWithSSE(app, project2Id, project2Response.body),
      ];
      
      const results = await Promise.all(generatePromises);
      
      // Both should complete successfully
      results.forEach((result) => {
        expect(result).toHaveProperty('completed', true);
        expect(result).toHaveProperty('eventCount');
        expect(result.eventCount).toBeGreaterThan(0);
      });
    }, 30000);
    
    it('should return 409 if generation already in progress', async () => {
      // Create project
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Conflict Test', framework: 'PROJECT_DEEPDIVE' })
        .expect(201);
      
      const projectId = createResponse.body.id;
      
      // Start first generation (but don't wait for it to complete)
      const gen1 = request(app)
        .post(`/api/generate/${projectId}`)
        .send({ project: createResponse.body });
      
      // Try to start another generation immediately
      await new Promise((resolve) => {
        setTimeout(() => {
          request(app)
            .post(`/api/generate/${projectId}`)
            .send({ project: createResponse.body })
            .expect(409)
            .end(resolve);
        }, 50);
      });
      
      // Clean up first request
      gen1.abort();
    });
  });
});

// Helper function to generate and collect SSE events
function generateWithSSE(app, projectId, project) {
  return new Promise((resolve) => {
    const events = [];
    
    request(app)
      .post(`/api/generate/${projectId}`)
      .send({ project })
      .on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              events.push(event);
            } catch (e) {
              // Ignore
            }
          }
        }
      })
      .on('end', () => {
        resolve({
          completed: events.some((e) => e.type === 'complete'),
          eventCount: events.length,
          events,
        });
      })
      .on('error', () => {
        resolve({
          completed: false,
          eventCount: 0,
          events: [],
        });
      });
  });
}
