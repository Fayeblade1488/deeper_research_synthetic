/**
 * @file Error handling middleware unit tests
 * @description Unit tests for the error handling middleware functions
 */

const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError,
  errorHandler,
  notFoundHandler
} = require('../../../api/v1/middleware/error-handler');

describe('Error Handling Middleware', () => {
  let req;
  let res;
  let next;
  let originalConsoleError;

  beforeEach(() => {
    // Mock console.error to prevent test output spam
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    req = {
      url: '/api/v1/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent/1.0'),
      originalUrl: '/api/v1/test',
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    next = jest.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 500);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create ValidationError with 400 status code', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create NotFoundError with 404 status code', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create UnauthorizedError with 401 status code', () => {
      const error = new UnauthorizedError('Unauthorized access');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create ForbiddenError with 403 status code', () => {
      const error = new ForbiddenError('Forbidden access');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Forbidden access');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create ConflictError with 409 status code', () => {
      const error = new ConflictError('Conflict detected');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Conflict detected');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test App Error', 400);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test App Error',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Application error',
        expect.objectContaining({
          error: 'Test App Error',
          stack: expect.any(String),
          url: '/api/v1/test',
          method: 'GET',
          ip: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Validation failed');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
      });
    });

    it('should handle Mongoose ValidationError', () => {
      const error = new Error('Test validation error');
      error.name = 'ValidationError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test validation error',
      });
    });

    it('should handle Mongoose CastError', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid ID format',
      });
    });

    it('should handle MongoDB duplicate key error', () => {
      const error = new Error('E11000 duplicate key error');
      error.code = 11000;
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Duplicate field value entered',
      });
    });

    it('should handle JWT errors', () => {
      const jsonWebTokenError = new Error('jwt malformed');
      jsonWebTokenError.name = 'JsonWebTokenError';
      
      errorHandler(jsonWebTokenError, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
    });

    it('should handle JWT expired errors', () => {
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';
      
      errorHandler(tokenExpiredError, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired',
      });
    });

    it('should handle generic errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Generic error');
      error.details = { field: 'value' };
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Generic error',
        stack: expect.any(String),
        details: { field: 'value' },
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Generic error');
      error.details = { field: 'value' };
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Generic error',
        details: { field: 'value' },
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic errors with 500 status in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Generic error');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should create NotFoundError for unmatched routes', () => {
      notFoundHandler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Route /api/v1/test not found',
        statusCode: 404,
        isOperational: true,
      }));
    });

    it('should handle missing originalUrl', () => {
      delete req.originalUrl;
      req.url = '/api/v1/test';
      
      notFoundHandler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFoundError',
        message: 'Route /api/v1/test not found',
        statusCode: 404,
        isOperational: true,
      }));
    });
  });
});