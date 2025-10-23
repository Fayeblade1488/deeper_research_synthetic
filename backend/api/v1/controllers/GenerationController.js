/**
 * @file Generation controller
 * @description REST API controller for content generation endpoints
 */

const { generateContent } = require('../../../services/generationService');
const ProjectService = require('../../../services/core/ProjectService');
const { performanceMonitor } = require('../../../services/performanceService');
const { NotFoundError, ValidationError } = require('../middleware/error-handler');
const logger = require('../../../utils/logger');

/**
 * Generation controller class
 * Handles HTTP requests for content generation endpoints
 */
class GenerationController {
  /**
   * Start content generation for a project
   * POST /api/v1/generate/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async startGeneration(req, res, next) {
    try {
      const { id: projectId } = req.params;
      const { project } = req.body;

      // Validate project exists
      if (!project) {
        throw new ValidationError('Project data is required');
      }

      logger.info('Starting content generation', { projectId });

      // Set up Server-Sent Events for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      res.flushHeaders();

      // Connection cleanup function with race condition protection
      let cleanupExecuted = false;
      const cleanupConnection = () => {
        if (cleanupExecuted) {
          logger.debug(`Cleanup already executed for project ${projectId}`);
          return;
        }
        cleanupExecuted = true;
        logger.info(`Cleaned up generation for project ${projectId}`);
      };

      // Handle client disconnection
      req.on('close', () => {
        logger.info(`Client disconnected for project ${projectId}`);
        cleanupConnection();
      });

      req.on('aborted', () => {
        logger.info(`Request aborted for project ${projectId}`);
        cleanupConnection();
      });

      // Set up connection timeout (30 minutes max)
      const connectionTimeout = setTimeout(() => {
        logger.info(`Connection timeout for project ${projectId}`);
        cleanupConnection();
        res.end();
      }, 30 * 60 * 1000); // 30 minutes

      // Record performance metrics for generation start
      const perfMetrics = performanceMonitor.recordGenerationStart(projectId);

      // Enhanced progress callback with error handling
      const onProgress = (update) => {
        try {
          if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);
          }
        } catch (writeError) {
          logger.error('Error writing to SSE stream', { 
            error: writeError.message,
            projectId
          });
          cleanupConnection();
        }
      };

      try {
        // Start generation
        const result = await generateContent(project, onProgress);

        // Record successful completion
        performanceMonitor.recordGenerationComplete(
          projectId, 
          perfMetrics.startTime, 
          true
        );

        // Send final result if connection is still alive
        if (!res.destroyed && !res.finished) {
          res.write(`data: ${JSON.stringify({
            type: 'complete',
            content: result.content,
            metadata: result.metadata,
          })}\n\n`);
        }

        res.end();

      } catch (error) {
        logger.error('Generation error', { 
          error: error.message, 
          projectId,
          stack: error.stack
        });

        // Record error and failed completion
        performanceMonitor.recordGenerationComplete(
          projectId, 
          perfMetrics.startTime, 
          false
        );
        performanceMonitor.recordError(error, { projectId, framework: project.framework });

        // Send error if connection is still alive
        if (!res.destroyed && !res.finished) {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message,
          })}\n\n`);
        }

        res.end();

      } finally {
        // Clear timeout and clean up
        clearTimeout(connectionTimeout);
        cleanupConnection();
      }
    } catch (error) {
      logger.error('Error in startGeneration controller', { 
        error: error.message, 
        projectId: req.params.id 
      });
      next(error);
    }
  }

  /**
   * Get generation status for a project
   * GET /api/v1/generate/:id/status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getGenerationStatus(req, res, next) {
    try {
      const { id: projectId } = req.params;
      
      logger.info('Checking generation status', { projectId });
      
      // For now, return a simple response
      // In a production system, you would check actual generation status
      res.json({
        success: true,
        data: {
          active: false,
          status: 'idle',
          message: 'Generation system ready'
        }
      });
    } catch (error) {
      logger.error('Error in getGenerationStatus controller', { 
        error: error.message, 
        projectId: req.params.id 
      });
      next(error);
    }
  }

  /**
   * Cancel active generation for a project
   * DELETE /api/v1/generate/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async cancelGeneration(req, res, next) {
    try {
      const { id: projectId } = req.params;
      
      logger.info('Cancelling generation', { projectId });
      
      // For now, return a simple response
      // In a production system, you would actually cancel the generation
      res.json({
        success: true,
        message: 'Generation cancelled'
      });
    } catch (error) {
      logger.error('Error in cancelGeneration controller', { 
        error: error.message, 
        projectId: req.params.id 
      });
      next(error);
    }
  }

  /**
   * Update generated content for a project
   * PUT /api/v1/generate/:id/content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateGeneratedContent(req, res, next) {
    try {
      const { id: projectId } = req.params;
      const { content, metadata } = req.body;

      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string');
      }

      logger.info('Updating generated content', { 
        projectId, 
        contentLength: content.length 
      });

      const project = await ProjectService.updateGeneratedContent(projectId, content, metadata);

      if (!project) {
        throw new NotFoundError(`Project with ID ${projectId} not found`);
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in updateGeneratedContent controller', { 
        error: error.message, 
        projectId: req.params.id 
      });
      next(error);
    }
  }
}

// Export singleton instance
module.exports = new GenerationController();