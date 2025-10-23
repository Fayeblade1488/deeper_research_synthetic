/**
 * @file Project repository
 * @description Data access layer for Project entities with database abstraction
 */

const Project = require('./Project');
const logger = require('../../utils/logger');

/**
 * Project repository class
 * Provides database operations for Project entities
 */
class ProjectRepository {
  /**
   * Find all projects
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of projects to return
   * @param {number} options.skip - Number of projects to skip
   * @param {Object} options.sort - Sort options
   * @returns {Promise<Array>} Array of projects
   */
  async findAll(options = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      const projects = await Project.findActive()
        .limit(limit)
        .skip(skip)
        .sort(sort);
      
      logger.debug('Found projects', { count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error finding projects', { error: error.message });
      throw error;
    }
  }

  /**
   * Find project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} Project object or null if not found
   */
  async findById(id) {
    try {
      const project = await Project.findByIdActive(id);
      logger.debug('Found project by ID', { id, found: !!project });
      return project;
    } catch (error) {
      logger.error('Error finding project by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project object
   */
  async create(projectData) {
    try {
      const project = new Project(projectData);
      const savedProject = await project.save();
      logger.info('Created project', { id: savedProject.id, name: savedProject.name });
      return savedProject;
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
  async update(id, updateData, version = null) {
    try {
      // Prepare update query
      const query = { _id: id, deletedAt: null };
      
      // Add version check for optimistic locking if provided
      if (version !== null) {
        query.version = version;
      }
      
      // Remove fields that shouldn't be updated directly
      const sanitizedUpdateData = { ...updateData };
      delete sanitizedUpdateData._id;
      delete sanitizedUpdateData.__v;
      delete sanitizedUpdateData.createdAt;
      
      // Increment version for optimistic locking
      sanitizedUpdateData.version = (sanitizedUpdateData.version || 0) + 1;
      sanitizedUpdateData.updatedAt = Date.now();
      
      const project = await Project.findOneAndUpdate(
        query,
        { $set: sanitizedUpdateData },
        { new: true, runValidators: true }
      );
      
      if (project) {
        logger.info('Updated project', { id: project.id, version: project.version });
      } else {
        logger.warn('Project not found or version mismatch during update', { id, version });
      }
      
      return project;
    } catch (error) {
      logger.error('Error updating project', { id, error: error.message, updateData });
      throw error;
    }
  }

  /**
   * Delete a project (soft delete)
   * @param {string} id - Project ID
   * @returns {Promise<boolean>} True if project was deleted, false if not found
   */
  async delete(id) {
    try {
      const project = await Project.findByIdActive(id);
      
      if (!project) {
        logger.warn('Project not found for deletion', { id });
        return false;
      }
      
      await project.softDelete();
      logger.info('Deleted project', { id });
      return true;
    } catch (error) {
      logger.error('Error deleting project', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Count projects
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} Number of projects matching filter
   */
  async count(filter = {}) {
    try {
      const count = await Project.findActive().countDocuments(filter);
      logger.debug('Counted projects', { count, filter });
      return count;
    } catch (error) {
      logger.error('Error counting projects', { error: error.message, filter });
      throw error;
    }
  }

  /**
   * Find projects by framework
   * @param {string} framework - Framework type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async findByFramework(framework, options = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      const projects = await Project.findActive({ framework })
        .limit(limit)
        .skip(skip)
        .sort(sort);
      
      logger.debug('Found projects by framework', { framework, count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error finding projects by framework', { framework, error: error.message });
      throw error;
    }
  }

  /**
   * Find projects by status
   * @param {string} status - Project status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async findByStatus(status, options = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      const projects = await Project.findActive({ status })
        .limit(limit)
        .skip(skip)
        .sort(sort);
      
      logger.debug('Found projects by status', { status, count: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error finding projects by status', { status, error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProjectRepository();