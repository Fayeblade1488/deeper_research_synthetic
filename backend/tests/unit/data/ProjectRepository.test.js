/**
 * @file Project repository unit tests
 * @description Unit tests for the ProjectRepository class
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Project = require('../../data/models/Project');
const ProjectRepository = require('../../data/repositories/ProjectRepository');

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

describe('ProjectRepository', () => {
  describe('findAll', () => {
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

      const projects = await ProjectRepository.findAll();

      expect(projects.length).toBe(2);
      expect(projects[0].name).toBe('Project 2'); // Most recent first
      expect(projects[1].name).toBe('Project 1');
      expect(projects.some(p => p.name === 'Deleted Project')).toBe(false);
    });

    it('should return empty array when no projects exist', async () => {
      const projects = await ProjectRepository.findAll();

      expect(projects).toEqual([]);
    });

    it('should respect limit and skip options', async () => {
      // Create multiple projects
      const projectPromises = [];
      for (let i = 1; i <= 10; i++) {
        projectPromises.push(
          new Project({
            name: `Project ${i}`,
            framework: 'PROJECT_DEEPDIVE',
          }).save()
        );
      }
      await Promise.all(projectPromises);

      const projects = await ProjectRepository.findAll({ limit: 5, skip: 2 });

      expect(projects.length).toBe(5);
      // Check that we got projects 3-7 (skip 2, limit 5)
      expect(projects[0].name).toBe('Project 8'); // Assuming descending order by createdAt
    });

    it('should respect sort options', async () => {
      // Create projects with different names
      const project1 = new Project({
        name: 'Alpha Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      await project1.save();

      const project2 = new Project({
        name: 'Beta Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      await project2.save();

      const projects = await ProjectRepository.findAll({ sort: { name: 1 } });

      expect(projects.length).toBe(2);
      expect(projects[0].name).toBe('Alpha Project');
      expect(projects[1].name).toBe('Beta Project');
    });
  });

  describe('findById', () => {
    it('should find project by ID', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      const foundProject = await ProjectRepository.findById(savedProject._id);

      expect(foundProject).toBeDefined();
      expect(foundProject.name).toBe('Test Project');
      expect(foundProject.framework).toBe('PROJECT_DEEPDIVE');
      expect(foundProject.sourceContext).toBe('Test context');
    });

    it('should return null for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const foundProject = await ProjectRepository.findById(nonExistentId);

      expect(foundProject).toBeNull();
    });

    it('should return null for deleted project', async () => {
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();
      await savedProject.softDelete();

      const foundProject = await ProjectRepository.findById(savedProject._id);

      expect(foundProject).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'New Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'New context',
      };

      const createdProject = await ProjectRepository.create(projectData);

      expect(createdProject.name).toBe('New Project');
      expect(createdProject.framework).toBe('PROJECT_DEEPDIVE');
      expect(createdProject.sourceContext).toBe('New context');
      expect(createdProject.createdAt).toBeDefined();
      expect(createdProject.updatedAt).toBeDefined();
      expect(createdProject._id).toBeDefined();
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        framework: 'PROJECT_DEEPDIVE', // Missing name
      };

      await expect(ProjectRepository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an existing project', async () => {
      const project = new Project({
        name: 'Original Name',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Original context',
      });
      const savedProject = await project.save();

      const updateData = {
        name: 'Updated Name',
        sourceContext: 'Updated context',
      };

      const updatedProject = await ProjectRepository.update(savedProject._id, updateData);

      expect(updatedProject).toBeDefined();
      expect(updatedProject.name).toBe('Updated Name');
      expect(updatedProject.sourceContext).toBe('Updated context');
      expect(updatedProject.framework).toBe('PROJECT_DEEPDIVE'); // Unchanged
      expect(updatedProject.version).toBe(1); // Version incremented
    });

    it('should return null for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };

      const updatedProject = await ProjectRepository.update(nonExistentId, updateData);

      expect(updatedProject).toBeNull();
    });

    it('should respect optimistic locking', async () => {
      const project = new Project({
        name: 'Original Name',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      // Update with correct version
      const updateData = { name: 'Updated Name' };
      const updatedProject = await ProjectRepository.update(
        savedProject._id, 
        updateData, 
        0 // Expected version
      );

      expect(updatedProject).toBeDefined();
      expect(updatedProject.name).toBe('Updated Name');
      expect(updatedProject.version).toBe(1);
    });

    it('should fail optimistic locking with wrong version', async () => {
      const project = new Project({
        name: 'Original Name',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      // Try to update with wrong version
      const updateData = { name: 'Updated Name' };
      const updatedProject = await ProjectRepository.update(
        savedProject._id, 
        updateData, 
        5 // Wrong version
      );

      expect(updatedProject).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete a project', async () => {
      const project = new Project({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      });
      const savedProject = await project.save();

      // Verify project exists before deletion
      const foundBefore = await ProjectRepository.findById(savedProject._id);
      expect(foundBefore).toBeDefined();

      // Delete project
      const deleted = await ProjectRepository.delete(savedProject._id);
      expect(deleted).toBe(true);

      // Verify project is soft deleted
      const foundAfter = await ProjectRepository.findById(savedProject._id);
      expect(foundAfter).toBeNull();

      // But it still exists in database
      const dbProject = await Project.findById(savedProject._id);
      expect(dbProject).toBeDefined();
      expect(dbProject.deletedAt).toBeDefined();
    });

    it('should return false for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const deleted = await ProjectRepository.delete(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all active projects', async () => {
      // Create multiple projects
      await ProjectRepository.create({
        name: 'Project 1',
        framework: 'PROJECT_DEEPDIVE',
      });

      await ProjectRepository.create({
        name: 'Project 2',
        framework: 'PROJECT_SYNTHETIC',
      });

      // Create deleted project
      const deletedProject = new Project({
        name: 'Deleted Project',
        framework: 'PROJECT_BENCHMARK',
      });
      const savedDeletedProject = await deletedProject.save();
      await savedDeletedProject.softDelete();

      const count = await ProjectRepository.count();

      expect(count).toBe(2);
    });

    it('should count projects with filter', async () => {
      await ProjectRepository.create({
        name: 'Deepdive Project',
        framework: 'PROJECT_DEEPDIVE',
      });

      await ProjectRepository.create({
        name: 'Synthetic Project',
        framework: 'PROJECT_SYNTHETIC',
      });

      const count = await ProjectRepository.count({ framework: 'PROJECT_DEEPDIVE' });

      expect(count).toBe(1);
    });
  });

  describe('findByFramework', () => {
    it('should find projects by framework', async () => {
      await ProjectRepository.create({
        name: 'Deepdive 1',
        framework: 'PROJECT_DEEPDIVE',
      });

      await ProjectRepository.create({
        name: 'Deepdive 2',
        framework: 'PROJECT_DEEPDIVE',
      });

      await ProjectRepository.create({
        name: 'Synthetic Project',
        framework: 'PROJECT_SYNTHETIC',
      });

      const projects = await ProjectRepository.findByFramework('PROJECT_DEEPDIVE');

      expect(projects.length).toBe(2);
      expect(projects.every(p => p.framework === 'PROJECT_DEEPDIVE')).toBe(true);
    });

    it('should respect options for findByFramework', async () => {
      // Create multiple projects
      const promises = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(
          ProjectRepository.create({
            name: `Deepdive ${i}`,
            framework: 'PROJECT_DEEPDIVE',
          })
        );
      }
      await Promise.all(promises);

      const projects = await ProjectRepository.findByFramework('PROJECT_DEEPDIVE', {
        limit: 3,
        skip: 1,
        sort: { name: 1 },
      });

      expect(projects.length).toBe(3);
      expect(projects[0].name).toBe('Deepdive 2');
    });
  });

  describe('findByStatus', () => {
    it('should find projects by status', async () => {
      const project1 = await ProjectRepository.create({
        name: 'Project 1',
        framework: 'PROJECT_DEEPDIVE',
        status: 'New',
      });

      const project2 = await ProjectRepository.create({
        name: 'Project 2',
        framework: 'PROJECT_DEEPDIVE',
        status: 'In Progress',
      });

      const projects = await ProjectRepository.findByStatus('New');

      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[0].status).toBe('New');
    });
  });
});