/**
 * @file Project service
 * @description Business logic layer for Project entities
 */

const ProjectRepository = require('../data/repositories/ProjectRepository');
const logger = require('../utils/logger');

/**
 * Project service class
 * Provides business logic for Project entities
 */
class ProjectService {
  /**
   * Get all projects
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async getAllProjects(options = {}) {
    try {
      logger.info('Fetching all projects', { options });
      const projects = await ProjectRepository.findAll(options);
      logger.info('Successfully fetched projects', { count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error fetching projects', { error: error.message, options });
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} Project object or null if not found
   */
  async getProjectById(id) {
    try {
      logger.info('Fetching project by ID', { id });
      const project = await ProjectRepository.findById(id);
      
      if (!project) {
        logger.warn('Project not found', { id });
        return null;
      }
      
      logger.info('Successfully fetched project', { id });
      return project;
    } catch (error) {
      logger.error('Error fetching project by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project object
   */
  async createProject(projectData) {
    try {
      // Validate required fields
      if (!projectData.name || !projectData.framework) {
        const error = new Error('Project name and framework are required');
        logger.warn('Validation error creating project', { 
          error: error.message, 
          projectData: { 
            name: projectData.name, 
            framework: projectData.framework 
          } 
        });
        throw error;
      }

      // Validate framework type
      const validFrameworks = ['PROJECT_DEEPDIVE', 'PROJECT_SYNTHETIC', 'PROJECT_BENCHMARK'];
      if (!validFrameworks.includes(projectData.framework)) {
        const error = new Error(`Invalid framework: ${projectData.framework}. Must be one of: ${validFrameworks.join(', ')}`);
        logger.warn('Validation error creating project', { 
          error: error.message, 
          framework: projectData.framework 
        });
        throw error;
      }

      logger.info('Creating new project', { 
        name: projectData.name, 
        framework: projectData.framework 
      });

      const project = await ProjectRepository.create(projectData);
      logger.info('Successfully created project', { id: project.id, name: project.name });
      return project;
    } catch (error) {
      logger.error('Error creating project', { error: error.message, projectData });
      throw error;
    }
  }

  /**
   * Update a project
   * @param {string} id - Project ID
   * @param {Object} updateData - Data to update
   * @param {number} version - Expected version for optimistic locking
   * @returns {Promise<Object|null>} Updated project object or null if not found/version mismatch
   */
  async updateProject(id, updateData, version = null) {
    try {
      logger.info('Updating project', { id, updateData, version });
      
      // Remove fields that shouldn't be updated directly
      const sanitizedUpdateData = { ...updateData };
      delete sanitizedUpdateData._id;
      delete sanitizedUpdateData.__v;
      delete sanitizedUpdateData.createdAt;
      
      const project = await ProjectRepository.update(id, sanitizedUpdateData, version);
      
      if (!project) {
        logger.warn('Project not found or version mismatch during update', { id, version });
        return null;
      }
      
      logger.info('Successfully updated project', { id, version: project.version });
      return project;
    } catch (error) {
      logger.error('Error updating project', { id, error: error.message, updateData, version });
      throw error;
    }
  }

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {Promise<boolean>} True if project was deleted, false if not found
   */
  async deleteProject(id) {
    try {
      logger.info('Deleting project', { id });
      const result = await ProjectRepository.delete(id);
      
      if (result) {
        logger.info('Successfully deleted project', { id });
      } else {
        logger.warn('Project not found for deletion', { id });
      }
      
      return result;
    } catch (error) {
      logger.error('Error deleting project', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Update project context
   * @param {string} id - Project ID
   * @param {string} sourceContext - New source context
   * @returns {Promise<Object|null>} Updated project object or null if not found
   */
  async updateProjectContext(id, sourceContext) {
    try {
      logger.info('Updating project context', { id, contextLength: sourceContext.length });
      
      const project = await this.updateProject(id, { sourceContext });
      
      if (!project) {
        logger.warn('Project not found when updating context', { id });
        return null;
      }
      
      logger.info('Successfully updated project context', { id });
      return project;
    } catch (error) {
      logger.error('Error updating project context', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Update generated content
   * @param {string} id - Project ID
   * @param {string} content - Generated content
   * @param {Object} metadata - Generation metadata
   * @returns {Promise<Object|null>} Updated project object or null if not found
   */
  async updateGeneratedContent(id, content, metadata) {
    try {
      logger.info('Updating generated content', { id, contentLength: content.length });
      
      const project = await this.updateProject(id, { 
        generatedContent: content,
        generationMetadata: metadata,
        status: 'Completed'
      });
      
      if (!project) {
        logger.warn('Project not found when updating generated content', { id });
        return null;
      }
      
      logger.info('Successfully updated generated content', { id });
      return project;
    } catch (error) {
      logger.error('Error updating generated content', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get projects by framework
   * @param {string} framework - Framework type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async getProjectsByFramework(framework, options = {}) {
    try {
      logger.info('Fetching projects by framework', { framework, options });
      const projects = await ProjectRepository.findByFramework(framework, options);
      logger.info('Successfully fetched projects by framework', { framework, count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error fetching projects by framework', { framework, error: error.message, options });
      throw error;
    }
  }

  /**
   * Get projects by status
   * @param {string} status - Project status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async getProjectsByStatus(status, options = {}) {
    try {
      logger.info('Fetching projects by status', { status, options });
      const projects = await ProjectRepository.findByStatus(status, options);
      logger.info('Successfully fetched projects by status', { status, count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error fetching projects by status', { status, error: error.message, options });
      throw error;
    }
  }

  /**
   * Get project statistics
   * @returns {Promise<Object>} Project statistics
   */
  async getProjectStats() {
    try {
      logger.info('Fetching project statistics');
      
      const total = await ProjectRepository.count();
      const deepdiveCount = await ProjectRepository.count({ framework: 'PROJECT_DEEPDIVE' });
      const syntheticCount = await ProjectRepository.count({ framework: 'PROJECT_SYNTHETIC' });
      const benchmarkCount = await ProjectRepository.count({ framework: 'PROJECT_BENCHMARK' });
      
      const stats = {
        total,
        byFramework: {
          'PROJECT_DEEPDIVE': deepdiveCount,
          'PROJECT_SYNTHETIC': syntheticCount,
          'PROJECT_BENCHMARK': benchmarkCount,
        },
        byStatus: {}
      };

      // Get status counts
      const statuses = ['New', 'In Progress', 'Completed', 'Failed', 'Cancelled'];
      for (const status of statuses) {
        const count = await ProjectRepository.count({ status });
        stats.byStatus[status] = count;
      }

      logger.info('Successfully fetched project statistics', { stats });
      return stats;
    } catch (error) {
      logger.error('Error fetching project statistics', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProjectService();