/**
 * @file Project service unit tests
 * @description Unit tests for the ProjectService class
 */

const ProjectService = require('../../../services/core/ProjectService');
const ProjectRepository = require('../../../data/repositories/ProjectRepository');

// Mock the ProjectRepository
jest.mock('../../../data/repositories/ProjectRepository');

describe('ProjectService', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProjects', () => {
    it('should return all projects from repository', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
        { id: '2', name: 'Project 2', framework: 'PROJECT_SYNTHETIC' },
      ];

      ProjectRepository.findAll.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getAllProjects();

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should pass options to repository', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      const options = { limit: 10, skip: 5 };

      ProjectRepository.findAll.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getAllProjects(options);

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findAll).toHaveBeenCalledWith(options);
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.getAllProjects()).rejects.toThrow(errorMessage);
    });
  });

  describe('getProjectById', () => {
    it('should return project from repository', async () => {
      const mockProject = { id: '1', name: 'Test Project' };
      ProjectRepository.findById.mockResolvedValue(mockProject);

      const project = await ProjectService.getProjectById('1');

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null for non-existent project', async () => {
      ProjectRepository.findById.mockResolvedValue(null);

      const project = await ProjectService.getProjectById('non-existent');

      expect(project).toBeNull();
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.findById.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.getProjectById('1')).rejects.toThrow(errorMessage);
    });
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'New Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const mockProject = { id: '1', ...projectData };
      ProjectRepository.create.mockResolvedValue(mockProject);

      const project = await ProjectService.createProject(projectData);

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.create).toHaveBeenCalledWith(projectData);
    });

    it('should validate required fields', async () => {
      await expect(ProjectService.createProject({}))
        .rejects
        .toThrow('Project name and framework are required');

      await expect(ProjectService.createProject({ name: 'Test' }))
        .rejects
        .toThrow('Project name and framework are required');

      await expect(ProjectService.createProject({ framework: 'PROJECT_DEEPDIVE' }))
        .rejects
        .toThrow('Project name and framework are required');
    });

    it('should validate framework type', async () => {
      const invalidFramework = { name: 'Test', framework: 'INVALID' };

      await expect(ProjectService.createProject(invalidFramework))
        .rejects
        .toThrow('Invalid framework: INVALID');
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      const projectData = { name: 'Test', framework: 'PROJECT_DEEPDIVE' };
      
      ProjectRepository.create.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.createProject(projectData))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('updateProject', () => {
    it('should update project with valid data', async () => {
      const updateData = { name: 'Updated Name' };
      const mockProject = { id: '1', name: 'Updated Name', version: 1 };
      
      ProjectRepository.update.mockResolvedValue(mockProject);

      const project = await ProjectService.updateProject('1', updateData);

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.update).toHaveBeenCalledWith('1', updateData, null);
    });

    it('should pass version for optimistic locking', async () => {
      const updateData = { name: 'Updated Name' };
      const mockProject = { id: '1', name: 'Updated Name', version: 2 };
      
      ProjectRepository.update.mockResolvedValue(mockProject);

      const project = await ProjectService.updateProject('1', updateData, 1);

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.update).toHaveBeenCalledWith('1', updateData, 1);
    });

    it('should return null for non-existent project', async () => {
      const updateData = { name: 'Updated Name' };
      ProjectRepository.update.mockResolvedValue(null);

      const project = await ProjectService.updateProject('non-existent', updateData);

      expect(project).toBeNull();
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      const updateData = { name: 'Updated Name' };
      
      ProjectRepository.update.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.updateProject('1', updateData))
        .rejects
        .toThrow(errorMessage);
    });

    it('should sanitize update data', async () => {
      const updateData = {
        name: 'Updated Name',
        _id: 'should-not-be-updated',
        __v: 5,
        createdAt: new Date(),
      };

      const expectedUpdateData = { name: 'Updated Name' };
      const mockProject = { id: '1', name: 'Updated Name', version: 1 };
      
      ProjectRepository.update.mockResolvedValue(mockProject);

      const project = await ProjectService.updateProject('1', updateData);

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.update).toHaveBeenCalledWith('1', expectedUpdateData, null);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      ProjectRepository.delete.mockResolvedValue(true);

      const result = await ProjectService.deleteProject('1');

      expect(result).toBe(true);
      expect(ProjectRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should return false for non-existent project', async () => {
      ProjectRepository.delete.mockResolvedValue(false);

      const result = await ProjectService.deleteProject('non-existent');

      expect(result).toBe(false);
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.delete.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.deleteProject('1'))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('updateProjectContext', () => {
    it('should update project context', async () => {
      const mockProject = { id: '1', sourceContext: 'Updated context' };
      ProjectRepository.update.mockResolvedValue(mockProject);

      const project = await ProjectService.updateProjectContext('1', 'Updated context');

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.update).toHaveBeenCalledWith('1', { sourceContext: 'Updated context' });
    });

    it('should return null for non-existent project', async () => {
      ProjectRepository.update.mockResolvedValue(null);

      const project = await ProjectService.updateProjectContext('non-existent', 'context');

      expect(project).toBeNull();
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.update.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.updateProjectContext('1', 'context'))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('updateGeneratedContent', () => {
    it('should update generated content and metadata', async () => {
      const content = 'Generated content';
      const metadata = { wordCount: 100, duration: 5 };
      const mockProject = { 
        id: '1', 
        generatedContent: content,
        generationMetadata: metadata,
        status: 'Completed'
      };
      
      ProjectRepository.update.mockResolvedValue(mockProject);

      const project = await ProjectService.updateGeneratedContent('1', content, metadata);

      expect(project).toEqual(mockProject);
      expect(ProjectRepository.update).toHaveBeenCalledWith('1', {
        generatedContent: content,
        generationMetadata: metadata,
        status: 'Completed'
      });
    });

    it('should return null for non-existent project', async () => {
      ProjectRepository.update.mockResolvedValue(null);

      const project = await ProjectService.updateGeneratedContent('non-existent', 'content', {});

      expect(project).toBeNull();
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.update.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.updateGeneratedContent('1', 'content', {}))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('getProjectsByFramework', () => {
    it('should return projects filtered by framework', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
      ];
      
      ProjectRepository.findByFramework.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getProjectsByFramework('PROJECT_DEEPDIVE');

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findByFramework).toHaveBeenCalledWith('PROJECT_DEEPDIVE', {});
    });

    it('should pass options to repository', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      const options = { limit: 5, skip: 0 };
      
      ProjectRepository.findByFramework.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getProjectsByFramework('PROJECT_DEEPDIVE', options);

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findByFramework).toHaveBeenCalledWith('PROJECT_DEEPDIVE', options);
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.findByFramework.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.getProjectsByFramework('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('getProjectsByStatus', () => {
    it('should return projects filtered by status', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'New' },
      ];
      
      ProjectRepository.findByStatus.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getProjectsByStatus('New');

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findByStatus).toHaveBeenCalledWith('New', {});
    });

    it('should pass options to repository', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1', status: 'New' }];
      const options = { limit: 5, skip: 0 };
      
      ProjectRepository.findByStatus.mockResolvedValue(mockProjects);

      const projects = await ProjectService.getProjectsByStatus('New', options);

      expect(projects).toEqual(mockProjects);
      expect(ProjectRepository.findByStatus).toHaveBeenCalledWith('New', options);
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.findByStatus.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.getProjectsByStatus('New'))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      // Mock count responses
      ProjectRepository.count.mockImplementation(async (filter = {}) => {
        if (Object.keys(filter).length === 0) return 10; // total
        if (filter.framework === 'PROJECT_DEEPDIVE') return 4;
        if (filter.framework === 'PROJECT_SYNTHETIC') return 3;
        if (filter.framework === 'PROJECT_BENCHMARK') return 3;
        if (filter.status === 'New') return 5;
        if (filter.status === 'In Progress') return 2;
        if (filter.status === 'Completed') return 2;
        if (filter.status === 'Failed') return 1;
        if (filter.status === 'Cancelled') return 0;
        return 0;
      });

      const stats = await ProjectService.getProjectStats();

      expect(stats).toEqual({
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
      });

      // Verify count was called the expected number of times
      expect(ProjectRepository.count).toHaveBeenCalledTimes(12);
    });

    it('should handle repository errors', async () => {
      const errorMessage = 'Database error';
      ProjectRepository.count.mockRejectedValue(new Error(errorMessage));

      await expect(ProjectService.getProjectStats())
        .rejects
        .toThrow(errorMessage);
    });
  });
});