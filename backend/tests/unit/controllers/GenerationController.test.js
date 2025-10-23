/**
 * @file Generation controller unit tests
 * @description Unit tests for the GenerationController class
 */

const GenerationController = require('../../../api/v1/controllers/GenerationController');
const { generateContent } = require('../../../services/generationService');
const ProjectService = require('../../../services/core/ProjectService');
const { performanceMonitor } = require('../../../services/performanceService');

// Mock the services
jest.mock('../../../services/generationService');
jest.mock('../../../services/core/ProjectService');
jest.mock('../../../services/performanceService');

describe('GenerationController', () => {
  let req;
  let res;
  let next;
  let originalWrite;
  let originalEnd;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock request, response, and next objects
    req = {
      params: {},
      query: {},
      body: {},
      headers: {},
      on: jest.fn(),
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent/1.0'),
    };
    
    res = {
      write: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      flushHeaders: jest.fn(),
      destroyed: false,
      finished: false,
    };
    
    next = jest.fn();
    
    // Mock performance monitor methods
    performanceMonitor.recordGenerationStart.mockReturnValue({
      startTime: Date.now(),
    });
    performanceMonitor.recordGenerationComplete.mockReturnValue();
    performanceMonitor.recordError.mockReturnValue();
  });

  describe('startGeneration', () => {
    it('should start content generation successfully', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: 'Test source context',
        }
      };
      
      // Mock generateContent to simulate streaming
      generateContent.mockImplementation(async (project, onProgress) => {
        // Simulate progress updates
        onProgress({ type: 'progress', wordCount: 100, chunkCount: 5 });
        onProgress({ type: 'progress', wordCount: 200, chunkCount: 10 });
        
        return {
          content: 'Generated content',
          metadata: {
            framework: 'PROJECT_DEEPDIVE',
            wordCount: 2,
            generationTime: 1000,
          }
        };
      });

      await GenerationController.startGeneration(req, res, next);

      // Verify response headers were set
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.flushHeaders).toHaveBeenCalled();

      // Verify SSE messages were sent
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('data:'));
      expect(res.end).toHaveBeenCalled();

      // Verify performance monitoring was called
      expect(performanceMonitor.recordGenerationStart).toHaveBeenCalledWith('test-project-id');
      expect(performanceMonitor.recordGenerationComplete).toHaveBeenCalledWith(
        'test-project-id',
        expect.any(Number),
        true
      );
    });

    it('should handle missing project data', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {}; // Missing project data

      await GenerationController.startGeneration(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'ValidationError',
        message: 'Project data is required',
      }));
    });

    it('should handle generation errors', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: 'Test source context',
        }
      };
      
      const errorMessage = 'Generation failed';
      generateContent.mockRejectedValue(new Error(errorMessage));

      await GenerationController.startGeneration(req, res, next);

      // Verify error was recorded
      expect(performanceMonitor.recordGenerationComplete).toHaveBeenCalledWith(
        'test-project-id',
        expect.any(Number),
        false
      );
      expect(performanceMonitor.recordError).toHaveBeenCalledWith(
        expect.any(Error),
        { projectId: 'test-project-id', framework: 'PROJECT_DEEPDIVE' }
      );

      // Verify SSE error message was sent
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('error'));
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle client disconnection', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: 'Test source context',
        }
      };
      
      // Mock generateContent to simulate a long-running process
      let progressCallback;
      generateContent.mockImplementation(async (project, onProgress) => {
        progressCallback = onProgress;
        
        // Simulate progress
        onProgress({ type: 'progress', wordCount: 100 });
        
        // Wait for a bit to simulate processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          content: 'Generated content',
          metadata: { framework: 'PROJECT_DEEPDIVE', wordCount: 2 }
        };
      });

      // Mock client disconnection during generation
      const closeCallback = jest.fn();
      req.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback.mockImplementation(callback);
        }
      });

      // Start generation
      const generationPromise = GenerationController.startGeneration(req, res, next);

      // Simulate client disconnection
      setTimeout(() => {
        if (progressCallback) {
          // This should trigger cleanup
          closeCallback();
        }
      }, 50);

      await generationPromise;

      // Verify cleanup happened
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      jest.useFakeTimers();
      
      req.params = { id: 'test-project-id' };
      req.body = {
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: 'Test source context',
        }
      };
      
      // Mock generateContent to never resolve
      generateContent.mockImplementation(() => new Promise(() => {}));

      const generationPromise = GenerationController.startGeneration(req, res, next);

      // Fast-forward timers to trigger timeout (30 minutes)
      jest.advanceTimersByTime(30 * 60 * 1000);

      await generationPromise;
      
      jest.useRealTimers();

      // Verify cleanup happened due to timeout
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle SSE write errors gracefully', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: 'Test source context',
        }
      };
      
      generateContent.mockImplementation(async (project, onProgress) => {
        // Simulate progress that causes write error
        res.write.mockImplementationOnce(() => {
          throw new Error('Write error');
        });
        
        onProgress({ type: 'progress', wordCount: 100 });
        
        return {
          content: 'Generated content',
          metadata: { framework: 'PROJECT_DEEPDIVE', wordCount: 2 }
        };
      });

      await GenerationController.startGeneration(req, res, next);

      // Verify generation still completed despite write error
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('getGenerationStatus', () => {
    it('should return generation status', async () => {
      req.params = { id: 'test-project-id' };
      
      await GenerationController.getGenerationStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          active: false,
          status: 'idle',
          message: 'Generation system ready'
        }
      });
    });

    it('should handle errors', async () => {
      req.params = { id: 'test-project-id' };
      
      const errorMessage = 'Service error';
      res.json.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      await GenerationController.getGenerationStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('cancelGeneration', () => {
    it('should cancel active generation', async () => {
      req.params = { id: 'test-project-id' };
      
      await GenerationController.cancelGeneration(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Generation cancelled'
      });
    });

    it('should handle errors', async () => {
      req.params = { id: 'test-project-id' };
      
      const errorMessage = 'Cancellation error';
      res.json.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      await GenerationController.cancelGeneration(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('updateGeneratedContent', () => {
    it('should update generated content successfully', async () => {
      req.params = { id: 'test-project-id' };
      req.body = {
        content: 'Updated generated content',
        metadata: { wordCount: 3 }
      };
      
      const mockProject = {
        id: 'test-project-id',
        generatedContent: 'Updated generated content',
        generationMetadata: { wordCount: 3 }
      };
      
      ProjectService.updateGeneratedContent.mockResolvedValue(mockProject);

      await GenerationController.updateGeneratedContent(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
      expect(ProjectService.updateGeneratedContent).toHaveBeenCalledWith(
        'test-project-id',
        'Updated generated content',
        { wordCount: 3 }
      );
    });

    it('should validate content type', async () => {
      req.params = { id: 'test-project-id' };
      req.body = { content: 123 }; // Invalid type
      
      await GenerationController.updateGeneratedContent(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'ValidationError',
        message: 'Content must be a string',
      }));
    });

    it('should handle non-existent project', async () => {
      req.params = { id: 'non-existent' };
      req.body = { content: 'Generated content' };
      
      ProjectService.updateGeneratedContent.mockResolvedValue(null);

      await GenerationController.updateGeneratedContent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: 'test-project-id' };
      req.body = { content: 'Generated content' };
      
      const errorMessage = 'Service error';
      ProjectService.updateGeneratedContent.mockRejectedValue(new Error(errorMessage));

      await GenerationController.updateGeneratedContent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });
});