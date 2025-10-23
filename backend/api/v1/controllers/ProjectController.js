/**
 * @file Project controller
 * @description REST API controller for Project endpoints
 */

const ProjectService = require('../../../services/core/ProjectService');
const { NotFoundError, ValidationError } = require('./error-handler');
const logger = require('../../../utils/logger');

/**
 * Project controller class
 * Handles HTTP requests for Project endpoints
 */
class ProjectController {
  /**
   * Get all projects
   * GET /api/v1/projects
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getAllProjects(req, res, next) {
    try {
      const { limit, skip, sort } = req.query;
      
      // Build options object
      const options = {};
      
      if (limit !== undefined) {
        options.limit = parseInt(limit);
      }
      
      if (skip !== undefined) {
        options.skip = parseInt(skip);
      }
      
      if (sort !== undefined) {
        options.sort = sort;
      }
      
      logger.info('Fetching all projects', { options });
      const projects = await ProjectService.getAllProjects(options);
      
      res.json({
        success: true,
        data: projects,
        meta: {
          count: projects.length,
          limit: options.limit,
          skip: options.skip,
        }
      });
    } catch (error) {
      logger.error('Error in getAllProjects controller', { error: error.message });
      next(error);
    }
  }

  /**
   * Get project by ID
   * GET /api/v1/projects/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Fetching project by ID', { id });
      const project = await ProjectService.getProjectById(id);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in getProjectById controller', { error: error.message, id: req.params.id });
      next(error);
    }
  }

  /**
   * Create a new project
   * POST /api/v1/projects
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async createProject(req, res, next) {
    try {
      const projectData = req.body;
      
      logger.info('Creating new project', { 
        name: projectData.name, 
        framework: projectData.framework 
      });
      
      const project = await ProjectService.createProject(projectData);
      
      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in createProject controller', { error: error.message });
      next(error);
    }
  }

  /**
   * Update a project
   * PUT /api/v1/projects/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const version = req.headers['if-match'] ? parseInt(req.headers['if-match']) : null;
      
      logger.info('Updating project', { id, updateData, version });
      
      const project = await ProjectService.updateProject(id, updateData, version);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found or version mismatch`);
      }
      
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in updateProject controller', { error: error.message, id: req.params.id });
      next(error);
    }
  }

  /**
   * Delete a project
   * DELETE /api/v1/projects/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Deleting project', { id });
      
      const deleted = await ProjectService.deleteProject(id);
      
      if (!deleted) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteProject controller', { error: error.message, id: req.params.id });
      next(error);
    }
  }

  /**
   * Update project context
   * PUT /api/v1/projects/:id/context
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateProjectContext(req, res, next) {
    try {
      const { id } = req.params;
      const { sourceContext } = req.body;
      
      if (typeof sourceContext !== 'string') {
        throw new ValidationError('Source context must be a string');
      }
      
      logger.info('Updating project context', { id, contextLength: sourceContext.length });
      
      const project = await ProjectService.updateProjectContext(id, sourceContext);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in updateProjectContext controller', { error: error.message, id: req.params.id });
      next(error);
    }
  }

  /**
   * Update generated content
   * PUT /api/v1/projects/:id/content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateGeneratedContent(req, res, next) {
    try {
      const { id } = req.params;
      const { content, metadata } = req.body;
      
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string');
      }
      
      logger.info('Updating generated content', { id, contentLength: content.length });
      
      const project = await ProjectService.updateGeneratedContent(id, content, metadata);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in updateGeneratedContent controller', { error: error.message, id: req.params.id });
      next(error);
    }
  }

  /**
   * Get projects by framework
   * GET /api/v1/projects/framework/:framework
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getProjectsByFramework(req, res, next) {
    try {
      const { framework } = req.params;
      const { limit, skip, sort } = req.query;
      
      // Build options object
      const options = {};
      
      if (limit !== undefined) {
        options.limit = parseInt(limit);
      }
      
      if (skip !== undefined) {
        options.skip = parseInt(skip);
      }
      
      if (sort !== undefined) {
        options.sort = sort;
      }
      
      logger.info('Fetching projects by framework', { framework, options });
      const projects = await ProjectService.getProjectsByFramework(framework, options);
      
      res.json({
        success: true,
        data: projects,
        meta: {
          framework,
          count: projects.length,
          limit: options.limit,
          skip: options.skip,
        }
      });
    } catch (error) {
      logger.error('Error in getProjectsByFramework controller', { error: error.message, framework: req.params.framework });
      next(error);
    }
  }

  /**
   * Get projects by status
   * GET /api/v1/projects/status/:status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getProjectsByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const { limit, skip, sort } = req.query;
      
      // Build options object
      const options = {};
      
      if (limit !== undefined) {
        options.limit = parseInt(limit);
      }
      
      if (skip !== undefined) {
        options.skip = parseInt(skip);
      }
      
      if (sort !== undefined) {
        options.sort = sort;
      }
      
      logger.info('Fetching projects by status', { status, options });
      const projects = await ProjectService.getProjectsByStatus(status, options);
      
      res.json({
        success: true,
        data: projects,
        meta: {
          status,
          count: projects.length,
          limit: options.limit,
          skip: options.skip,
        }
      });
    } catch (error) {
      logger.error('Error in getProjectsByStatus controller', { error: error.message, status: req.params.status });
      next(error);
    }
  }

  /**
   * Get project statistics
   * GET /api/v1/projects/stats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getProjectStats(req, res, next) {
    try {
      logger.info('Fetching project statistics');
      const stats = await ProjectService.getProjectStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getProjectStats controller', { error: error.message });
      next(error);
    }
  }
}

// Export singleton instance
module.exports = new ProjectController();