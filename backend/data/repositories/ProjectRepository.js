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
   * Create a new project with race condition protection
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project object
   */
  async create(projectData) {
    const session = await require('mongoose').startSession();
    session.startTransaction();

    try {
      // Check if project with same name already exists (prevents race condition)
      const existing = await Project.findOne(
        { name: projectData.name, deletedAt: null },
        null,
        { session }
      );

      if (existing) {
        await session.abortTransaction();
        throw new Error(`Project with name "${projectData.name}" already exists`);
      }

      // Create and save the project within transaction
      const project = new Project(projectData);
      const savedProject = await project.save({ session });

      // Commit transaction
      await session.commitTransaction();

      logger.info('Created project', { 
        id: savedProject.id, 
        name: savedProject.name,
        message: 'Transaction committed successfully'
      });

      return savedProject;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      logger.error('Error creating project', { 
        error: error.message, 
        projectData,
        message: 'Transaction rolled back'
      });
      throw error;
    } finally {
      // Always end session
      session.endSession();
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

  /**
   * Safely search projects with input validation (prevents NoSQL injection)
   * @param {Object} filters - Filter criteria (validated and sanitized)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of projects
   */
  async secureSearch(filters = {}, options = {}) {
    try {
      // Allowed filter fields to prevent operator injection
      const ALLOWED_FILTERS = ['name', 'framework', 'status', 'createdAt', 'updatedAt'];
      const sanitizedFilters = { deletedAt: null }; // Always exclude deleted projects

      for (const [key, value] of Object.entries(filters)) {
        // Only allow whitelisted fields
        if (!ALLOWED_FILTERS.includes(key)) {
          logger.warn(`Rejecting unauthorized filter field: ${key}`);
          continue;
        }

        // Prevent operator injection by rejecting objects with $ keys
        if (value !== null && typeof value === 'object') {
          const hasOperators = Object.keys(value).some(k => k.startsWith('$'));
          if (hasOperators) {
            logger.warn(`Rejecting filter with MongoDB operators for field: ${key}`);
            continue;
          }
        }

        // For string/number/boolean values, accept as-is
        // For objects, they must be explicit allowed formats
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitizedFilters[key] = value;
        } else if (value === null) {
          sanitizedFilters[key] = null;
        } else {
          logger.warn(`Rejecting non-primitive filter value for field: ${key}`);
          continue;
        }
      }

      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;

      const projects = await Project.find(sanitizedFilters)
        .limit(Math.min(limit, 1000)) // Cap limit at 1000
        .skip(Math.max(skip, 0))
        .sort(sort);

      logger.debug('Secure search completed', { 
        filterCount: Object.keys(sanitizedFilters).length, 
        resultCount: projects.length 
      });
      return projects;
    } catch (error) {
      logger.error('Error in secure search', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProjectRepository();