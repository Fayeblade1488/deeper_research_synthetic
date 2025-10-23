/**
 * @file API service unit tests
 * @description Unit tests for the frontend API service functions
 */

// Mock fetch globally
global.fetch = jest.fn();

// Import the API service functions
const {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  startGeneration,
  checkGenerationStatus,
  cancelGeneration,
  updateProjectWithGeneratedContent,
  checkServerStatus
} = require('../../src/services/apiService');

describe('API Service', () => {
  const API_URL = 'http://localhost:5173/api';
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up environment variable
    process.env.VITE_API_URL = API_URL;
  });

  describe('fetchProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
        { id: '2', name: 'Project 2', framework: 'PROJECT_SYNTHETIC' },
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProjects),
      });

      const projects = await fetchProjects();

      expect(projects).toEqual(mockProjects);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/projects`);
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchProjects()).rejects.toThrow('Failed to fetch projects');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchProjects()).rejects.toThrow('Network error');
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectName = 'New Project';
      const framework = 'PROJECT_DEEPDIVE';
      const mockProject = {
        id: '1',
        name: projectName,
        framework,
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
      };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProject),
      });

      const project = await createProject(projectName, framework);

      expect(project).toEqual(mockProject);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, framework }),
      });
    });

    it('should throw error when creation fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(createProject('Test', 'PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Failed to create project');
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const projectId = '1';
      const updates = { name: 'Updated Project' };
      const mockProject = {
        id: projectId,
        name: 'Updated Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
      };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProject),
      });

      const project = await updateProject(projectId, updates);

      expect(project).toEqual(mockProject);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    });

    it('should throw error when update fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(updateProject('non-existent', { name: 'Updated' }))
        .rejects
        .toThrow('Failed to update project');
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      fetch.mockResolvedValue({
        ok: true,
      });

      await expect(deleteProject('1')).resolves.not.toThrow();
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/projects/1`, {
        method: 'DELETE',
      });
    });

    it('should throw error when deletion fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(deleteProject('non-existent'))
        .rejects
        .toThrow('Failed to delete project');
    });
  });

  describe('startGeneration', () => {
    it('should start generation successfully', async () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      // Mock the EventSource constructor
      const mockEventSource = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
      };

      global.EventSource = jest.fn(() => mockEventSource);

      const onProgress = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      const cleanup = startGeneration(project, onProgress, onComplete, onError);

      expect(global.EventSource).toHaveBeenCalledWith(`${API_URL}/generate/1`);
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(typeof cleanup).toBe('function');
    });

    it('should handle progress events', () => {
      const project = { id: '1', name: 'Test Project' };
      const onProgress = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      // Mock the EventSource constructor
      const mockEventSource = {
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') {
            // Simulate a progress event
            handler({ data: JSON.stringify({ type: 'progress', wordCount: 100 }) });
          }
        }),
        removeEventListener: jest.fn(),
        close: jest.fn(),
      };

      global.EventSource = jest.fn(() => mockEventSource);

      startGeneration(project, onProgress, onComplete, onError);

      expect(onProgress).toHaveBeenCalledWith({ type: 'progress', wordCount: 100 });
    });

    it('should handle completion events', () => {
      const project = { id: '1', name: 'Test Project' };
      const onProgress = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      // Mock the EventSource constructor
      const mockEventSource = {
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') {
            // Simulate a completion event
            handler({ data: JSON.stringify({ type: 'complete', content: 'Generated content' }) });
          }
        }),
        removeEventListener: jest.fn(),
        close: jest.fn(),
      };

      global.EventSource = jest.fn(() => mockEventSource);

      startGeneration(project, onProgress, onComplete, onError);

      expect(onComplete).toHaveBeenCalledWith({ type: 'complete', content: 'Generated content' });
    });

    it('should handle error events', () => {
      const project = { id: '1', name: 'Test Project' });
      const onProgress = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      // Mock the EventSource constructor
      const mockEventSource = {
        addEventListener: jest.fn((event, handler) => {
          if (event === 'error') {
            // Simulate an error event
            handler({ data: 'Connection error' });
          }
        }),
        removeEventListener: jest.fn(),
        close: jest.fn(),
      };

      global.EventSource = jest.fn(() => mockEventSource);

      startGeneration(project, onProgress, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Connection error');
    });
  });

  describe('checkGenerationStatus', () => {
    it('should check generation status successfully', async () => {
      const mockStatus = { active: true, status: 'running' };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatus),
      });

      const status = await checkGenerationStatus('1');

      expect(status).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/generate/1/status`);
    });

    it('should throw error when status check fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(checkGenerationStatus('1'))
        .rejects
        .toThrow('Failed to check generation status');
    });
  });

  describe('cancelGeneration', () => {
    it('should cancel generation successfully', async () => {
      const mockResponse = { message: 'Generation cancelled' };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const response = await cancelGeneration('1');

      expect(response).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/generate/1`, {
        method: 'DELETE',
      });
    });

    it('should throw error when cancellation fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(cancelGeneration('non-existent'))
        .rejects
        .toThrow('Failed to cancel generation');
    });
  });

  describe('updateProjectWithGeneratedContent', () => {
    it('should update project with generated content successfully', async () => {
      const projectId = '1';
      const content = 'Generated content';
      const metadata = { wordCount: 100 };
      const mockProject = {
        id: projectId,
        generatedContent: content,
        generationMetadata: metadata,
      };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProject),
      });

      const project = await updateProjectWithGeneratedContent(projectId, content, metadata);

      expect(project).toEqual(mockProject);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedContent: content,
          generationMetadata: metadata,
        }),
      });
    });

    it('should throw error when update fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(updateProjectWithGeneratedContent('1', 'content', {}))
        .rejects
        .toThrow('Failed to update project with generated content');
    });
  });

  describe('checkServerStatus', () => {
    it('should check server status successfully', async () => {
      const mockStatus = {
        status: 'THE FORGE is operational',
        phase: 'Operation COGNITION',
        projectCount: 0,
        geminiConfigured: false,
      };

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatus),
      });

      const status = await checkServerStatus();

      expect(status).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/status`);
    });

    it('should throw error when status check fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(checkServerStatus())
        .rejects
        .toThrow('Failed to check server status');
    });
  });
});