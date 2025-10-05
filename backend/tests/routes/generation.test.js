/**
 * @file This file contains tests for the generation API routes.
 * @author Paradroid AI
 * @version 1.0.0
 */
const request = require('supertest');
const express = require('express');
const generationRoutes = require('../../routes/generation');
const { generateContent } = require('../../services/generationService');

// Mock the generation service
jest.mock('../../services/generationService', () => ({
  generateContent: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/', generationRoutes);

describe('Generation Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:id', () => {
    it('should initiate generation and stream updates', async () => {
      const mockProject = { id: 'some-project-id', name: 'Test Project' };
      generateContent.mockImplementation(async (project, onProgress) => {
        onProgress({ type: 'status', message: 'Starting' });
        onProgress({ type: 'chunk', content: 'Hello' });
        return { content: 'Hello World', metadata: {} };
      });

      const response = await request(app)
        .post('/some-project-id')
        .send({ project: mockProject });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(generateContent).toHaveBeenCalledWith(mockProject, expect.any(Function));
      
      // Check for SSE events in the response text
      expect(response.text).toContain('data: {"type":"status","message":"Starting"}\n\n');
      expect(response.text).toContain('data: {"type":"chunk","content":"Hello"}\n\n');
      expect(response.text).toContain('data: {"type":"complete","content":"Hello World","metadata":{}}\n\n');
    });

    it('should return 400 if project data is missing', async () => {
        const response = await request(app)
          .post('/some-project-id')
          .send({});
  
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Project data is required');
      });
  });

  describe('GET /:id/status', () => {
    it('should return not active if no generation is running', async () => {
      const response = await request(app).get('/some-project-id/status');
      
      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
    });
  });

  describe('DELETE /:id', () => {
    it('should return 404 if no active generation is found', async () => {
      const response = await request(app).delete('/some-project-id');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No active generation found');
    });
  });
});