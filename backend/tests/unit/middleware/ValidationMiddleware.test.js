/**
 * @file Validation middleware unit tests
 * @description Unit tests for the validation middleware functions
 */

const {
  validateProjectCreation,
  validateProjectId,
  validateProjectUpdate,
  validatePagination
} = require('../../../api/v1/middleware/validation');

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    next = jest.fn();
  });

  describe('validateProjectCreation', () => {
    it('should validate valid project creation data', () => {
      req.body = {
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('Test Project'); // Should be trimmed
    });

    it('should reject missing project name', () => {
      req.body = {
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name is required and must be a non-empty string',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty project name', () => {
      req.body = {
        name: '',
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name is required and must be a non-empty string',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-string project name', () => {
      req.body = {
        name: 123,
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name is required and must be a non-empty string',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject project name that is too long', () => {
      req.body = {
        name: 'A'.repeat(201), // 201 characters, exceeds limit of 200
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name cannot exceed 200 characters',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing framework', () => {
      req.body = {
        name: 'Test Project',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Framework is required and must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid framework', () => {
      req.body = {
        name: 'Test Project',
        framework: 'INVALID_FRAMEWORK',
      };

      validateProjectCreation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Framework is required and must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should trim project name', () => {
      req.body = {
        name: '  Test Project  ',
        framework: 'PROJECT_DEEPDIVE',
      };

      validateProjectCreation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('Test Project');
    });

    it('should handle internal server errors', () => {
      // Mock console.error to prevent test output spam
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by making req.body undefined
      req.body = undefined;
      
      validateProjectCreation(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error during validation',
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validateProjectId', () => {
    it('should validate valid UUID format', () => {
      req.params = {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID v4
      };

      validateProjectId(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid UUID format', () => {
      req.params = {
        id: 'invalid-id',
      };

      validateProjectId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid project ID format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing ID', () => {
      req.params = {};

      validateProjectId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid project ID format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty ID', () => {
      req.params = {
        id: '',
      };

      validateProjectId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid project ID format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', () => {
      // Mock console.error to prevent test output spam
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by making req.params undefined
      req.params = undefined;
      
      validateProjectId(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error during validation',
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validateProjectUpdate', () => {
    it('should allow valid update fields', () => {
      req.body = {
        name: 'Updated Project Name',
        sourceContext: 'Updated source context',
        status: 'In Progress',
      };

      validateProjectUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid update fields', () => {
      req.body = {
        name: 'Updated Project Name',
        invalidField: 'Should not be allowed',
      };

      validateProjectUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid fields in update: invalidField. Allowed fields: name, sourceContext, generatedContent, generationMetadata, status, tags',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate name format', () => {
      req.body = {
        name: '', // Empty name is invalid
      };

      validateProjectUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name must be a non-empty string',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate name length', () => {
      req.body = {
        name: 'A'.repeat(201), // Too long
      };

      validateProjectUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project name cannot exceed 200 characters',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate status values', () => {
      req.body = {
        status: 'Invalid Status',
      };

      validateProjectUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid status. Must be one of: New, In Progress, Completed, Failed, Cancelled',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should trim name', () => {
      req.body = {
        name: '  Updated Project Name  ',
      };

      validateProjectUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('Updated Project Name');
    });

    it('should handle internal server errors', () => {
      // Mock console.error to prevent test output spam
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by making req.body undefined
      req.body = undefined;
      
      validateProjectUpdate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error during validation',
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validatePagination', () => {
    it('should validate valid limit', () => {
      req.query = {
        limit: '10',
      };

      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.limit).toBe(10); // Should be converted to number
    });

    it('should validate valid skip', () => {
      req.query = {
        skip: '20',
      };

      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.skip).toBe(20); // Should be converted to number
    });

    it('should reject invalid limit', () => {
      req.query = {
        limit: 'invalid',
      };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Limit must be a number between 1 and 1000',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject limit below minimum', () => {
      req.query = {
        limit: '0',
      };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Limit must be a number between 1 and 1000',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject limit above maximum', () => {
      req.query = {
        limit: '1001',
      };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Limit must be a number between 1 and 1000',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject negative skip', () => {
      req.query = {
        skip: '-10',
      };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Skip must be a non-negative number',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid skip', () => {
      req.query = {
        skip: 'invalid',
      };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Skip must be a non-negative number',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', () => {
      // Mock console.error to prevent test output spam
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by making req.query undefined
      req.query = undefined;
      
      validatePagination(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error during validation',
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});