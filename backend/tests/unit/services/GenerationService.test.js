/**
 * @file Security service unit tests
 * @description Unit tests for the SecurityService class
 */

const SecurityService = require('../../../services/securityService');
const rateLimit = require('express-rate-limit');

// Mock express-rate-limit
jest.mock('express-rate-limit');

describe('SecurityService', () => {
  let securityService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create new security service instance
    securityService = new SecurityService();
  });

  describe('constructor', () => {
    it('should initialize with default thresholds', () => {
      expect(securityService.thresholds).toEqual({
        maxInputLength: 1000000,
        maxArrayLength: 10000,
        maxDepth: 10,
        maxKeys: 1000,
        regexTimeout: 1000,
      });
    });
  });

  describe('validateAndSanitizeString', () => {
    it('should validate and sanitize valid string input', () => {
      const input = 'Test <script>alert("xss")</script> Input';
      const result = securityService.validateAndSanitizeString(input);
      
      expect(result).toBe('Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Input');
    });

    it('should handle null input', () => {
      const result = securityService.validateAndSanitizeString(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = securityService.validateAndSanitizeString(undefined);
      expect(result).toBeNull();
    });

    it('should convert non-string input to string', () => {
      const result = securityService.validateAndSanitizeString(123);
      expect(result).toBe('123');
    });

    it('should throw error for input exceeding max length', () => {
      securityService.thresholds.maxInputLength = 10;
      const longInput = 'A'.repeat(20);
      
      expect(() => securityService.validateAndSanitizeString(longInput))
        .toThrow('Input exceeds maximum length of 10 characters');
    });

    it('should handle empty string', () => {
      const result = securityService.validateAndSanitizeString('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Test Input  ';
      const result = securityService.validateAndSanitizeString(input);
      expect(result).toBe('Test Input');
    });

    it('should normalize whitespace when requested', () => {
      const input = 'Test    Input';
      const result = securityService.validateAndSanitizeString(input, { normalizeWhitespace: true });
      expect(result).toBe('Test Input');
    });

    it('should not normalize whitespace when disabled', () => {
      const input = 'Test    Input';
      const result = securityService.validateAndSanitizeString(input, { normalizeWhitespace: false });
      expect(result).toBe('Test    Input');
    });

    it('should escape HTML when requested', () => {
      const input = '<script>alert("xss")</script>';
      const result = securityService.validateAndSanitizeString(input, { escapeHtml: true });
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should not escape HTML when disabled', () => {
      const input = '<b>Bold Text</b>';
      const result = securityService.validateAndSanitizeString(input, { escapeHtml: false });
      expect(result).toBe('<b>Bold Text</b>');
    });
  });

  describe('validateProjectName', () => {
    it('should validate and sanitize valid project name', () => {
      const name = 'Test Project <script>alert("xss")</script>';
      const result = securityService.validateProjectName(name);
      
      expect(result).toBe('Test Project &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should throw error for empty project name', () => {
      expect(() => securityService.validateProjectName(''))
        .toThrow('Project name cannot be empty');
      
      expect(() => securityService.validateProjectName(null))
        .toThrow('Project name cannot be empty');
      
      expect(() => securityService.validateProjectName(undefined))
        .toThrow('Project name cannot be empty');
    });

    it('should throw error for project name exceeding 200 characters', () => {
      const longName = 'A'.repeat(201);
      
      expect(() => securityService.validateProjectName(longName))
        .toThrow('Project name cannot exceed 200 characters');
    });

    it('should handle project name with leading/trailing whitespace', () => {
      const name = '  Test Project  ';
      const result = securityService.validateProjectName(name);
      
      expect(result).toBe('Test Project');
    });
  });

  describe('validateFrameworkType', () => {
    it('should validate valid framework types', () => {
      expect(securityService.validateFrameworkType('PROJECT_DEEPDIVE'))
        .toBe('PROJECT_DEEPDIVE');
      
      expect(securityService.validateFrameworkType('PROJECT_SYNTHETIC'))
        .toBe('PROJECT_SYNTHETIC');
      
      expect(securityService.validateFrameworkType('PROJECT_BENCHMARK'))
        .toBe('PROJECT_BENCHMARK');
    });

    it('should throw error for invalid framework type', () => {
      expect(() => securityService.validateFrameworkType('INVALID_FRAMEWORK'))
        .toThrow('Invalid framework. Must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK');
    });

    it('should throw error for empty framework type', () => {
      expect(() => securityService.validateFrameworkType(''))
        .toThrow('Framework type cannot be empty');
      
      expect(() => securityService.validateFrameworkType(null))
        .toThrow('Framework type cannot be empty');
      
      expect(() => securityService.validateFrameworkType(undefined))
        .toThrow('Framework type cannot be empty');
    });
  });

  describe('validateProjectId', () => {
    it('should validate valid UUID project ID', () => {
      const validId = '550e8400-e29b-41d4-a716-446655440000';
      const result = securityService.validateProjectId(validId);
      
      expect(result).toBe(validId);
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => securityService.validateProjectId('invalid-id'))
        .toThrow('Invalid project ID format');
      
      expect(() => securityService.validateProjectId('123'))
        .toThrow('Invalid project ID format');
      
      expect(() => securityService.validateProjectId('550e8400-e29b-41d4-a716-446655440000-invalid'))
        .toThrow('Invalid project ID format');
    });

    it('should throw error for empty project ID', () => {
      expect(() => securityService.validateProjectId(''))
        .toThrow('Project ID cannot be empty');
      
      expect(() => securityService.validateProjectId(null))
        .toThrow('Project ID cannot be empty');
      
      expect(() => securityService.validateProjectId(undefined))
        .toThrow('Project ID cannot be empty');
    });
  });

  describe('validateProjectUpdates', () => {
    it('should validate and sanitize project updates', () => {
      const updates = {
        name: 'Updated Project <script>alert("xss")</script>',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Updated source context with <b>HTML</b>',
        status: 'In Progress',
      };
      
      const result = securityService.validateProjectUpdates(updates);
      
      expect(result).toEqual({
        name: 'Updated Project &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Updated source context with <b>HTML</b>',
        status: 'In Progress',
      });
    });

    it('should reject non-object updates', () => {
      expect(() => securityService.validateProjectUpdates('invalid'))
        .toThrow('Project updates must be an object');
      
      expect(() => securityService.validateProjectUpdates(null))
        .toThrow('Project updates must be an object');
      
      expect(() => securityService.validateProjectUpdates(undefined))
        .toThrow('Project updates must be an object');
    });

    it('should skip forbidden fields', () => {
      const updates = {
        name: 'Updated Project',
        _id: 'forbidden',
        __v: 1,
        createdAt: new Date(),
        deletedAt: new Date(),
        version: 5,
      };
      
      const result = securityService.validateProjectUpdates(updates);
      
      expect(result).toEqual({
        name: 'Updated Project',
      });
      
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.deletedAt).toBeUndefined();
      expect(result.version).toBeUndefined();
    });

    it('should validate status values', () => {
      const validStatuses = [
        'New',
        'In Progress',
        'Completed',
        'Failed',
        'Cancelled',
      ];
      
      for (const status of validStatuses) {
        const updates = { status };
        const result = securityService.validateProjectUpdates(updates);
        expect(result.status).toBe(status);
      }
    });

    it('should throw error for invalid status values', () => {
      const updates = { status: 'Invalid Status' };
      
      expect(() => securityService.validateProjectUpdates(updates))
        .toThrow('Invalid status. Must be one of: New, In Progress, Completed, Failed, Cancelled');
    });

    it('should validate generation metadata', () => {
      const updates = { 
        generationMetadata: { 
          wordCount: 1000,
          duration: 30,
        } 
      };
      
      const result = securityService.validateProjectUpdates(updates);
      
      expect(result.generationMetadata).toEqual({
        wordCount: 1000,
        duration: 30,
      });
    });

    it('should handle null generation metadata', () => {
      const updates = { generationMetadata: null };
      
      const result = securityService.validateProjectUpdates(updates);
      
      expect(result.generationMetadata).toBeNull();
    });

    it('should throw error for invalid generation metadata', () => {
      const updates = { generationMetadata: 'invalid' };
      
      expect(() => securityService.validateProjectUpdates(updates))
        .toThrow('Generation metadata must be an object or null');
    });

    it('should validate string fields length limits', () => {
      securityService.thresholds.maxInputLength = 100;
      const longContent = 'A'.repeat(150);
      const updates = { sourceContext: longContent };
      
      expect(() => securityService.validateProjectUpdates(updates))
        .toThrow('Field sourceContext exceeds maximum length of 100 characters');
    });

    it('should validate numeric fields', () => {
      const updates = { version: 5 };
      
      const result = securityService.validateProjectUpdates(updates);
      
      expect(result.version).toBe(5);
    });

    it('should throw error for invalid field types', () => {
      const updates = { invalidField: {} };
      
      expect(() => securityService.validateProjectUpdates(updates))
        .toThrow('Invalid field type for invalidField: object');
    });
  });

  describe('validateHeaders', () => {
    it('should validate and sanitize HTTP headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Agent <script>alert("xss")</script>',
        'X-Custom-Header': 'Custom Value',
      };
      
      const result = securityService.validateHeaders(headers);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'user-agent': 'Test Agent &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        'x-custom-header': 'Custom Value',
      });
    });

    it('should reject non-object headers', () => {
      expect(() => securityService.validateHeaders('invalid'))
        .toThrow('Headers must be an object');
      
      expect(() => securityService.validateHeaders(null))
        .toThrow('Headers must be an object');
      
      expect(() => securityService.validateHeaders(undefined))
        .toThrow('Headers must be an object');
    });

    it('should handle empty headers object', () => {
      const result = securityService.validateHeaders({});
      expect(result).toEqual({});
    });

    it('should skip invalid header names', () => {
      const headers = {
        'valid-header': 'valid value',
        'invalid header with spaces': 'invalid value',
        '': 'empty header name',
        'header-with-<script>': 'value with XSS',
      };
      
      const result = securityService.validateHeaders(headers);
      
      expect(result).toEqual({
        'valid-header': 'valid value',
        'header-with-&lt;script&gt;': 'value with XSS',
      });
    });

    it('should handle numeric header values', () => {
      const headers = {
        'Content-Length': 1234,
        'X-Rate-Limit': 100,
      };
      
      const result = securityService.validateHeaders(headers);
      
      expect(result).toEqual({
        'content-length': '1234',
        'x-rate-limit': '100',
      });
    });

    it('should throw error for header values exceeding length limits', () => {
      securityService.thresholds.maxInputLength = 100;
      const longHeaderValue = 'A'.repeat(150);
      const headers = {
        'X-Long-Header': longHeaderValue,
      };
      
      expect(() => securityService.validateHeaders(headers))
        .toThrow('Header X-Long-Header value exceeds maximum length of 100 characters');
    });

    it('should skip invalid header value types', () => {
      const headers = {
        'valid-header': 'valid value',
        'invalid-header': {},
        'another-invalid-header': [],
        'numeric-header': 123,
      };
      
      const result = securityService.validateHeaders(headers);
      
      expect(result).toEqual({
        'valid-header': 'valid value',
        'numeric-header': '123',
      });
    });
  });

  describe('safeMatch', () => {
    it('should perform regex match successfully', async () => {
      const text = 'This is a test string';
      const pattern = /test/;
      
      const result = await securityService.safeMatch(text, pattern);
      
      expect(result).toEqual(expect.arrayContaining(['test']));
    });

    it('should timeout on long-running regex', async () => {
      const text = 'a'.repeat(10000) + 'b';
      // This regex can cause catastrophic backtracking
      const pattern = /(a+)+b/;
      
      await expect(securityService.safeMatch(text, pattern, 50))
        .rejects
        .toThrow('Regex timeout - potential ReDoS attack');
    });

    it('should handle invalid regex patterns', async () => {
      const text = 'test';
      const pattern = /[/; // Invalid regex
      
      await expect(securityService.safeMatch(text, pattern))
        .rejects
        .toThrow();
    });

    it('should handle null text', async () => {
      const pattern = /test/;
      
      const result = await securityService.safeMatch(null, pattern);
      
      expect(result).toBeNull();
    });

    it('should handle undefined text', async () => {
      const pattern = /test/;
      
      const result = await securityService.safeMatch(undefined, pattern);
      
      expect(result).toBeNull();
    });

    it('should use default timeout when not specified', async () => {
      const text = 'This is a test string';
      const pattern = /test/;
      
      const result = await securityService.safeMatch(text, pattern);
      
      expect(result).toEqual(expect.arrayContaining(['test']));
    });
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with default options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const limiter = securityService.createRateLimiter();
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should create rate limiter with custom options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const customOptions = {
        windowMs: 60 * 1000,
        max: 50,
        message: 'Custom rate limit message',
      };
      
      const limiter = securityService.createRateLimiter(customOptions);
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 60 * 1000,
        max: 50,
        message: 'Custom rate limit message',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });
  });

  describe('createStrictRateLimiter', () => {
    it('should create strict rate limiter with default options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const limiter = securityService.createStrictRateLimiter();
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many requests from this IP. Please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should create strict rate limiter with custom options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const customOptions = {
        windowMs: 30 * 1000,
        max: 5,
        message: 'Custom strict rate limit message',
      };
      
      const limiter = securityService.createStrictRateLimiter(customOptions);
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 30 * 1000,
        max: 5,
        message: 'Custom strict rate limit message',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });
  });

  describe('createGenerationRateLimiter', () => {
    it('should create generation rate limiter with default options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const limiter = securityService.createGenerationRateLimiter();
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: 'Generation rate limit exceeded. Please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should create generation rate limiter with custom options', () => {
      const mockLimiter = jest.fn();
      rateLimit.mockReturnValue(mockLimiter);
      
      const customOptions = {
        windowMs: 30 * 60 * 1000,
        max: 3,
        message: 'Custom generation rate limit message',
      };
      
      const limiter = securityService.createGenerationRateLimiter(customOptions);
      
      expect(limiter).toBe(mockLimiter);
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 30 * 60 * 1000,
        max: 3,
        message: 'Custom generation rate limit message',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });
  });

  describe('validateObjectComplexity', () => {
    it('should validate simple object complexity', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(true);
    });

    it('should validate nested object complexity within limits', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: 'test'
            }
          }
        }
      };
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(true);
    });

    it('should reject object exceeding depth limit', () => {
      securityService.thresholds.maxDepth = 3;
      
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'too deep'
              }
            }
          }
        }
      };
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(false);
    });

    it('should validate array complexity within limits', () => {
      const obj = {
        items: [1, 2, 3, 4, 5]
      };
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(true);
    });

    it('should reject array exceeding length limit', () => {
      securityService.thresholds.maxArrayLength = 5;
      
      const obj = {
        items: Array(10).fill(1)
      };
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(false);
    });

    it('should validate object with many keys within limits', () => {
      const obj = {};
      for (let i = 0; i < 100; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(true);
    });

    it('should reject object exceeding key limit', () => {
      securityService.thresholds.maxKeys = 50;
      
      const obj = {};
      for (let i = 0; i < 100; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      
      const result = securityService.validateObjectComplexity(obj);
      
      expect(result).toBe(false);
    });

    it('should handle null object', () => {
      const result = securityService.validateObjectComplexity(null);
      expect(result).toBe(true);
    });

    it('should handle undefined object', () => {
      const result = securityService.validateObjectComplexity(undefined);
      expect(result).toBe(true);
    });

    it('should handle primitive values', () => {
      expect(securityService.validateObjectComplexity(123)).toBe(true);
      expect(securityService.validateObjectComplexity('test')).toBe(true);
      expect(securityService.validateObjectComplexity(true)).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize string input', () => {
      const input = 'Test <script>alert("xss")</script> Input';
      const result = securityService.sanitizeInput(input);
      
      expect(result).toBe('Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Input');
    });

    it('should sanitize array input', () => {
      const input = [
        'Test <script>alert("xss")</script> Item 1',
        'Test <script>alert("xss")</script> Item 2',
      ];
      const result = securityService.sanitizeInput(input);
      
      expect(result).toEqual([
        'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Item 1',
        'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Item 2',
      ]);
    });

    it('should sanitize object input', () => {
      const input = {
        name: 'Test <script>alert("xss")</script> Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test <b>HTML</b> context',
      };
      const result = securityService.sanitizeInput(input);
      
      expect(result).toEqual({
        name: 'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test &lt;b&gt;HTML&lt;/b&gt; context',
      });
    });

    it('should handle null input', () => {
      const result = securityService.sanitizeInput(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = securityService.sanitizeInput(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle number input', () => {
      const result = securityService.sanitizeInput(123);
      expect(result).toBe(123);
    });

    it('should handle boolean input', () => {
      const result = securityService.sanitizeInput(true);
      expect(result).toBe(true);
      
      const result2 = securityService.sanitizeInput(false);
      expect(result2).toBe(false);
    });

    it('should prevent prototype pollution', () => {
      const input = {
        name: 'Test Project',
        __proto__: { polluted: true },
        constructor: { polluted: true },
        prototype: { polluted: true },
      };
      const result = securityService.sanitizeInput(input);
      
      expect(result.name).toBe('Test Project');
      expect(result.polluted).toBeUndefined();
      expect(result.__proto__).toBeUndefined();
      expect(result.constructor).toBeUndefined();
      expect(result.prototype).toBeUndefined();
    });

    it('should sanitize nested objects', () => {
      const input = {
        project: {
          name: 'Test <script>alert("xss")</script> Project',
          details: {
            framework: 'PROJECT_DEEPDIVE',
            context: 'Test <b>HTML</b> context',
          }
        }
      };
      const result = securityService.sanitizeInput(input);
      
      expect(result).toEqual({
        project: {
          name: 'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Project',
          details: {
            framework: 'PROJECT_DEEPDIVE',
            context: 'Test &lt;b&gt;HTML&lt;/b&gt; context',
          }
        }
      });
    });

    it('should sanitize nested arrays', () => {
      const input = {
        projects: [
          { name: 'Project <script>alert("xss")</script> 1' },
          { name: 'Project <script>alert("xss")</script> 2' },
        ]
      };
      const result = securityService.sanitizeInput(input);
      
      expect(result).toEqual({
        projects: [
          { name: 'Project &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; 1' },
          { name: 'Project &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; 2' },
        ]
      });
    });

    it('should sanitize unknown types by converting to string', () => {
      const input = new Date('2023-01-01T00:00:00Z');
      const result = securityService.sanitizeInput(input);
      
      expect(result).toBe('Sun Jan 01 2023 00:00:00 GMT+0000 (Coordinated Universal Time)');
    });
  });

  describe('getSecurityMetrics', () => {
    it('should return security metrics', () => {
      const mockPerfMetrics = {
        status: 'healthy',
        currentMemory: { rss: 50, heapUsed: 30, heapTotal: 60 },
        activeGenerations: 0,
        totalRequests: 100,
        errors: 5,
        averageResponseTime: 150,
        uptime: 3600000,
      };
      
      // Mock performanceMonitor.getMetrics
      jest.mock('../../../services/performanceService', () => ({
        performanceMonitor: {
          getMetrics: jest.fn().mockReturnValue(mockPerfMetrics)
        }
      }));
      
      // Re-import security service to get updated mock
      jest.resetModules();
      const SecurityService = require('../../../services/securityService');
      const securityServiceWithMock = new SecurityService();
      
      const metrics = securityServiceWithMock.getSecurityMetrics();
      
      expect(metrics).toEqual({
        requestsBlocked: 5,
        activeSecurityChecks: 0,
        totalSecurityEvents: 100,
        securityStatus: 'healthy',
        thresholds: securityServiceWithMock.thresholds,
      });
    });
  });

  describe('updateThresholds', () => {
    it('should update security thresholds', () => {
      const newThresholds = {
        maxInputLength: 2000000,
        maxArrayLength: 20000,
      };
      
      securityService.updateThresholds(newThresholds);
      
      expect(securityService.thresholds.maxInputLength).toBe(2000000);
      expect(securityService.thresholds.maxArrayLength).toBe(20000);
      expect(securityService.thresholds.regexTimeout).toBe(1000); // Unchanged
    });

    it('should handle empty thresholds object', () => {
      const originalThresholds = { ...securityService.thresholds };
      
      securityService.updateThresholds({});
      
      expect(securityService.thresholds).toEqual(originalThresholds);
    });

    it('should handle null thresholds object', () => {
      const originalThresholds = { ...securityService.thresholds };
      
      securityService.updateThresholds(null);
      
      expect(securityService.thresholds).toEqual(originalThresholds);
    });

    it('should handle undefined thresholds object', () => {
      const originalThresholds = { ...securityService.thresholds };
      
      securityService.updateThresholds(undefined);
      
      expect(securityService.thresholds).toEqual(originalThresholds);
    });

    it('should add new threshold properties', () => {
      const newThresholds = {
        customThreshold: 100,
      };
      
      securityService.updateThresholds(newThresholds);
      
      expect(securityService.thresholds.customThreshold).toBe(100);
      expect(securityService.thresholds.maxInputLength).toBe(1000000); // Unchanged
    });
  });
});