/**
 * @file Project controller unit tests
 * @description Unit tests for the ProjectController class
 */

const ProjectController = require('../../../api/v1/controllers/ProjectController');
const ProjectService = require('../../../services/core/ProjectService');

// Mock the ProjectService
jest.mock('../../../services/core/ProjectService');

describe('ProjectController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock request, response, and next objects
    req = {
      params: {},
      query: {},
      body: {},
      headers: {},
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    
    next = jest.fn();
  });

  describe('getAllProjects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
        { id: '2', name: 'Project 2', framework: 'PROJECT_SYNTHETIC' },
      ];
      
      ProjectService.getAllProjects.mockResolvedValue(mockProjects);

      await ProjectController.getAllProjects(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects,
        meta: {
          count: 2,
          limit: undefined,
          skip: undefined,
        }
      });
    });

    it('should pass query options to service', async () => {
      req.query = { limit: 10, skip: 5, sort: '-createdAt' };
      
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      ProjectService.getAllProjects.mockResolvedValue(mockProjects);

      await ProjectController.getAllProjects(req, res, next);

      expect(ProjectService.getAllProjects).toHaveBeenCalledWith({
        limit: 10,
        skip: 5,
        sort: '-createdAt',
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Service error';
      ProjectService.getAllProjects.mockRejectedValue(new Error(errorMessage));

      await ProjectController.getAllProjects(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      req.params = { id: '1' };
      
      const mockProject = { id: '1', name: 'Test Project' };
      ProjectService.getProjectById.mockResolvedValue(mockProject);

      await ProjectController.getProjectById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
      });
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { id: 'non-existent' };
      
      ProjectService.getProjectById.mockResolvedValue(null);

      await ProjectController.getProjectById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: '1' };
      
      const errorMessage = 'Service error';
      ProjectService.getProjectById.mockRejectedValue(new Error(errorMessage));

      await ProjectController.getProjectById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      req.body = {
        name: 'New Project',
        framework: 'PROJECT_DEEPDIVE',
      };
      
      const mockProject = { id: '1', ...req.body };
      ProjectService.createProject.mockResolvedValue(mockProject);

      await ProjectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
      });
    });

    it('should handle service errors', async () => {
      req.body = { name: 'New Project', framework: 'PROJECT_DEEPDIVE' };
      
      const errorMessage = 'Service error';
      ProjectService.createProject.mockRejectedValue(new Error(errorMessage));

      await ProjectController.createProject(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Name' };
      req.headers = { 'if-match': '1' }; // Version header
      
      const mockProject = { id: '1', name: 'Updated Name', version: 2 };
      ProjectService.updateProject.mockResolvedValue(mockProject);

      await ProjectController.updateProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
      });
      expect(ProjectService.updateProject).toHaveBeenCalledWith('1', req.body, 1);
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { id: 'non-existent' };
      req.body = { name: 'Updated Name' };
      
      ProjectService.updateProject.mockResolvedValue(null);

      await ProjectController.updateProject(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found or version mismatch',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Name' };
      
      const errorMessage = 'Service error';
      ProjectService.updateProject.mockRejectedValue(new Error(errorMessage));

      await ProjectController.updateProject(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      req.params = { id: '1' };
      
      ProjectService.deleteProject.mockResolvedValue(true);

      await ProjectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { id: 'non-existent' };
      
      ProjectService.deleteProject.mockResolvedValue(false);

      await ProjectController.deleteProject(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: '1' };
      
      const errorMessage = 'Service error';
      ProjectService.deleteProject.mockRejectedValue(new Error(errorMessage));

      await ProjectController.deleteProject(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('updateProjectContext', () => {
    it('should update project context', async () => {
      req.params = { id: '1' };
      req.body = { sourceContext: 'Updated context' };
      
      const mockProject = { id: '1', sourceContext: 'Updated context' };
      ProjectService.updateProjectContext.mockResolvedValue(mockProject);

      await ProjectController.updateProjectContext(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
      });
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { id: 'non-existent' };
      req.body = { sourceContext: 'Updated context' };
      
      ProjectService.updateProjectContext.mockResolvedValue(null);

      await ProjectController.updateProjectContext(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found',
      }));
    });

    it('should validate source context type', async () => {
      req.params = { id: '1' };
      req.body = { sourceContext: 123 }; // Invalid type
      
      await ProjectController.updateProjectContext(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'ValidationError',
        message: 'Source context must be a string',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: '1' };
      req.body = { sourceContext: 'Updated context' };
      
      const errorMessage = 'Service error';
      ProjectService.updateProjectContext.mockRejectedValue(new Error(errorMessage));

      await ProjectController.updateProjectContext(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('updateGeneratedContent', () => {
    it('should update generated content', async () => {
      req.params = { id: '1' };
      req.body = { 
        content: 'Generated content',
        metadata: { wordCount: 100 }
      };
      
      const mockProject = { 
        id: '1', 
        generatedContent: 'Generated content',
        generationMetadata: { wordCount: 100 }
      };
      ProjectService.updateGeneratedContent.mockResolvedValue(mockProject);

      await ProjectController.updateGeneratedContent(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject,
      });
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { id: 'non-existent' };
      req.body = { content: 'Generated content' };
      
      ProjectService.updateGeneratedContent.mockResolvedValue(null);

      await ProjectController.updateGeneratedContent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Project with ID non-existent not found',
      }));
    });

    it('should validate content type', async () => {
      req.params = { id: '1' };
      req.body = { content: 123 }; // Invalid type
      
      await ProjectController.updateGeneratedContent(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'ValidationError',
        message: 'Content must be a string',
      }));
    });

    it('should handle service errors', async () => {
      req.params = { id: '1' };
      req.body = { content: 'Generated content' };
      
      const errorMessage = 'Service error';
      ProjectService.updateGeneratedContent.mockRejectedValue(new Error(errorMessage));

      await ProjectController.updateGeneratedContent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('getProjectsByFramework', () => {
    it('should return projects filtered by framework', async () => {
      req.params = { framework: 'PROJECT_DEEPDIVE' };
      req.query = { limit: 5 };
      
      const mockProjects = [
        { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
      ];
      ProjectService.getProjectsByFramework.mockResolvedValue(mockProjects);

      await ProjectController.getProjectsByFramework(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects,
        meta: {
          framework: 'PROJECT_DEEPDIVE',
          count: 1,
          limit: 5,
          skip: undefined,
        }
      });
      expect(ProjectService.getProjectsByFramework).toHaveBeenCalledWith(
        'PROJECT_DEEPDIVE',
        { limit: 5, skip: undefined, sort: undefined }
      );
    });

    it('should handle service errors', async () => {
      req.params = { framework: 'PROJECT_DEEPDIVE' };
      
      const errorMessage = 'Service error';
      ProjectService.getProjectsByFramework.mockRejectedValue(new Error(errorMessage));

      await ProjectController.getProjectsByFramework(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('getProjectsByStatus', () => {
    it('should return projects filtered by status', async () => {
      req.params = { status: 'New' };
      
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'New' },
      ];
      ProjectService.getProjectsByStatus.mockResolvedValue(mockProjects);

      await ProjectController.getProjectsByStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects,
        meta: {
          status: 'New',
          count: 1,
          limit: undefined,
          skip: undefined,
        }
      });
      expect(ProjectService.getProjectsByStatus).toHaveBeenCalledWith(
        'New',
        { limit: undefined, skip: undefined, sort: undefined }
      );
    });

    it('should handle service errors', async () => {
      req.params = { status: 'New' };
      
      const errorMessage = 'Service error';
      ProjectService.getProjectsByStatus.mockRejectedValue(new Error(errorMessage));

      await ProjectController.getProjectsByStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockStats = {
        total: 10,
        byFramework: {
          'PROJECT_DEEPDIVE': 4,
          'PROJECT_SYNTHETIC': 3,
          'PROJECT_BENCHMARK': 3,
        },
        byStatus: {
          'New': 5,
          'In Progress': 2,
          'Completed': 2,
          'Failed': 1,
          'Cancelled': 0,
        }
      };
      
      ProjectService.getProjectStats.mockResolvedValue(mockStats);

      await ProjectController.getProjectStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
      expect(ProjectService.getProjectStats).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Service error';
      ProjectService.getProjectStats.mockRejectedValue(new Error(errorMessage));

      await ProjectController.getProjectStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });
});