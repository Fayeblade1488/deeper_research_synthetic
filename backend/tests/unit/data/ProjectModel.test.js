/**
 * @file Project model unit tests
 * @description Unit tests for the Project Mongoose model
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Project = require('../data/models/Project');

// Global variables for MongoDB memory server
let mongoServer;

/**
 * Connect to the in-memory database
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
 * Disconnect from the in-memory database
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

describe('Project Model', () => {
  describe('Validation', () => {
    it('should create a project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'This is test source context',
        generatedContent: 'This is generated content',
        status: 'New',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      // Assertions
      expect(savedProject.name).toBe(projectData.name);
      expect(savedProject.framework).toBe(projectData.framework);
      expect(savedProject.sourceContext).toBe(projectData.sourceContext);
      expect(savedProject.generatedContent).toBe(projectData.generatedContent);
      expect(savedProject.status).toBe(projectData.status);
      expect(savedProject.createdAt).toBeDefined();
      expect(savedProject.updatedAt).toBeDefined();
      expect(savedProject.version).toBe(0);
    });

    it('should require project name', async () => {
      const projectData = {
        framework: 'PROJECT_DEEPDIVE',
      };

      let err;
      try {
        const project = new Project(projectData);
        await project.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.name.message).toContain('Project name is required');
    });

    it('should require framework type', async () => {
      const projectData = {
        name: 'Test Project',
      };

      let err;
      try {
        const project = new Project(projectData);
        await project.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.framework).toBeDefined();
      expect(err.errors.framework.message).toContain('Framework type is required');
    });

    it('should validate framework type enum', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'INVALID_FRAMEWORK',
      };

      let err;
      try {
        const project = new Project(projectData);
        await project.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.framework).toBeDefined();
      expect(err.errors.framework.message).toContain('Framework must be one of');
    });

    it('should validate project name length', async () => {
      const longName = 'A'.repeat(201); // 201 characters, exceeds limit of 200
      const projectData = {
        name: longName,
        framework: 'PROJECT_DEEPDIVE',
      };

      let err;
      try {
        const project = new Project(projectData);
        await project.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.name.message).toContain('Project name cannot exceed 200 characters');
    });

    it('should validate status enum', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        status: 'INVALID_STATUS',
      };

      let err;
      try {
        const project = new Project(projectData);
        await project.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
      expect(err.errors.status.message).toContain('Status must be one of');
    });
  });

  describe('Defaults', () => {
    it('should set default values correctly', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.sourceContext).toBe('');
      expect(savedProject.generatedContent).toBe('');
      expect(savedProject.generationMetadata).toBeNull();
      expect(savedProject.status).toBe('New');
      expect(savedProject.version).toBe(0);
    });

    it('should set timestamps automatically', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.createdAt).toBeDefined();
      expect(savedProject.updatedAt).toBeDefined();
      expect(savedProject.createdAt).toEqual(savedProject.updatedAt);
    });
  });

  describe('Methods', () => {
    it('should perform soft delete correctly', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.deletedAt).toBeNull();

      const deletedProject = await savedProject.softDelete();
      expect(deletedProject.deletedAt).toBeDefined();
      expect(deletedProject.deletedAt).toBeInstanceOf(Date);
    });

    it('should check if project is deleted', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.isDeleted()).toBe(false);

      await savedProject.softDelete();
      expect(savedProject.isDeleted()).toBe(true);
    });

    it('should increment version correctly', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.version).toBe(0);

      const updatedProject = await savedProject.incrementVersion().save();
      expect(updatedProject.version).toBe(1);
    });

    it('should calculate word count correctly', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        generatedContent: 'This is a test with seven words in the content.',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.wordCount).toBe(7);
    });

    it('should handle empty content for word count', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        generatedContent: '',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.wordCount).toBe(0);
    });
  });

  describe('Static Methods', () => {
    it('should find active projects correctly', async () => {
      // Create active project
      const activeProject = new Project({
        name: 'Active Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      await activeProject.save();

      // Create deleted project
      const deletedProject = new Project({
        name: 'Deleted Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedDeletedProject = await deletedProject.save();
      await savedDeletedProject.softDelete();

      // Find active projects
      const activeProjects = await Project.findActive();
      
      expect(activeProjects.length).toBe(1);
      expect(activeProjects[0].name).toBe('Active Project');
    });

    it('should find project by ID and ensure it is not deleted', async () => {
      // Create active project
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      // Find by ID
      const foundProject = await Project.findByIdActive(savedProject._id);
      
      expect(foundProject).toBeDefined();
      expect(foundProject.name).toBe('Test Project');
    });

    it('should not find deleted project by ID', async () => {
      // Create and delete project
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();
      await savedProject.softDelete();

      // Try to find deleted project
      const foundProject = await Project.findByIdActive(savedProject._id);
      
      expect(foundProject).toBeNull();
    });
  });

  describe('Indexes', () => {
    it('should have correct indexes', async () => {
      const indexes = await Project.collection.indexes();
      
      // Check for expected indexes
      const indexNames = indexes.map(index => index.name);
      
      expect(indexNames).toContain('createdAt_-1');
      expect(indexNames).toContain('framework_1');
      expect(indexNames).toContain('status_1');
      // Text index
      expect(indexNames.some(name => name.includes('_text'))).toBe(true);
    });
  });

  describe('Middleware', () => {
    it('should update updatedAt timestamp on save', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      const initialUpdatedAt = savedProject.updatedAt;
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update project
      savedProject.sourceContext = 'Updated context';
      const updatedProject = await savedProject.save();

      expect(updatedProject.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });
});