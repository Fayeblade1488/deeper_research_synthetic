/**
 * @file Validation middleware
 * @description Request validation middleware for API endpoints
 */

const logger = require('../../utils/logger');

/**
 * Validate project creation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateProjectCreation(req, res, next) {
  try {
    const { name, framework } = req.body || {};
    
    // Validate project name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      logger.warn('Project name validation failed', { name, type: typeof name });
      return res.status(400).json({ 
        error: 'Project name is required and must be a non-empty string' 
      });
    }
    
    // Validate name length
    if (name.length > 200) {
      logger.warn('Project name too long', { nameLength: name.length });
      return res.status(400).json({ 
        error: 'Project name cannot exceed 200 characters' 
      });
    }
    
    // Validate framework
    const validFrameworks = ['PROJECT_DEEPDIVE', 'PROJECT_SYNTHETIC', 'PROJECT_BENCHMARK'];
    if (!framework || !validFrameworks.includes(framework)) {
      logger.warn('Project framework validation failed', { framework });
      return res.status(400).json({ 
        error: `Framework is required and must be one of: ${validFrameworks.join(', ')}` 
      });
    }
    
    // Trim name
    req.body.name = name.trim();
    
    logger.debug('Project creation validation passed');
    next();
  } catch (error) {
    logger.error('Error during project creation validation', { error: error.message });
    res.status(500).json({ error: 'Internal server error during validation' });
  }
}

/**
 * Validate project ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateProjectId(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!id || !uuidRegex.test(id)) {
      logger.warn('Invalid project ID format', { id });
      return res.status(400).json({ 
        error: 'Invalid project ID format' 
      });
    }
    
    logger.debug('Project ID validation passed', { id });
    next();
  } catch (error) {
    logger.error('Error during project ID validation', { error: error.message });
    res.status(500).json({ error: 'Internal server error during validation' });
  }
}

/**
 * Validate project update request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateProjectUpdate(req, res, next) {
  try {
    const updates = req.body || {};
    
    // Define allowed update fields
    const allowedFields = [
      'name', 'sourceContext', 'generatedContent', 
      'generationMetadata', 'status', 'tags'
    ];
    
    // Check for disallowed fields
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
    
    if (invalidFields.length > 0) {
      logger.warn('Invalid fields in project update', { invalidFields });
      return res.status(400).json({ 
        error: `Invalid fields in update: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`
      });
    }
    
    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        logger.warn('Invalid project name in update', { name: updates.name });
        return res.status(400).json({ 
          error: 'Project name must be a non-empty string' 
        });
      }
      
      if (updates.name.length > 200) {
        logger.warn('Project name too long in update', { nameLength: updates.name.length });
        return res.status(400).json({ 
          error: 'Project name cannot exceed 200 characters' 
        });
      }
      
      // Trim name
      updates.name = updates.name.trim();
    }
    
    // Validate status if provided
    if (updates.status !== undefined) {
      const validStatuses = ['New', 'In Progress', 'Completed', 'Failed', 'Cancelled'];
      if (!validStatuses.includes(updates.status)) {
        logger.warn('Invalid project status in update', { status: updates.status });
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }
    
    logger.debug('Project update validation passed', { fields: updateKeys });
    next();
  } catch (error) {
    logger.error('Error during project update validation', { error: error.message });
    res.status(500).json({ error: 'Internal server error during validation' });
  }
}

/**
 * Validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validatePagination(req, res, next) {
  try {
    const { limit, skip, sort } = req.query;
    
    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        logger.warn('Invalid limit parameter', { limit });
        return res.status(400).json({ 
          error: 'Limit must be a number between 1 and 1000' 
        });
      }
      req.query.limit = limitNum;
    }
    
    // Validate skip
    if (skip !== undefined) {
      const skipNum = parseInt(skip);
      if (isNaN(skipNum) || skipNum < 0) {
        logger.warn('Invalid skip parameter', { skip });
        return res.status(400).json({ 
          error: 'Skip must be a non-negative number' 
        });
      }
      req.query.skip = skipNum;
    }
    
    logger.debug('Pagination validation passed', { limit, skip, sort });
    next();
  } catch (error) {
    logger.error('Error during pagination validation', { error: error.message });
    res.status(500).json({ error: 'Internal server error during validation' });
  }
}

module.exports = {
  validateProjectCreation,
  validateProjectId,
  validateProjectUpdate,
  validatePagination,
};