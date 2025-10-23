/**
 * @file Security service
 * @description Security service for input validation, sanitization, and threat prevention
 */

const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { performanceMonitor } = require('../services/performanceService');

/**
 * Security service class
 * Provides security functions for input validation, sanitization, and threat prevention
 */
class SecurityService {
  /**
   * Constructor
   */
  constructor() {
    // Initialize security thresholds
    this.thresholds = {
      maxInputLength: 1000000, // 1MB max input
      maxArrayLength: 10000,   // 10,000 array items max
      maxDepth: 10,            // 10 levels of nesting max
      maxKeys: 1000,           // 1,000 object keys max
      regexTimeout: 1000,      // 1 second regex timeout
    };
  }

  /**
   * Validates and sanitizes string input
   * @param {string} input - Input string to validate and sanitize
   * @param {Object} options - Validation options
   * @returns {string|null} Sanitized string or null if invalid
   */
  validateAndSanitizeString(input, options = {}) {
    // Check if input is provided
    if (input === null || input === undefined) {
      return null;
    }

    // Convert to string if not already
    if (typeof input !== 'string') {
      input = String(input);
    }

    // Check length limits
    if (input.length > this.thresholds.maxInputLength) {
      throw new Error(`Input exceeds maximum length of ${this.thresholds.maxInputLength} characters`);
    }

    // Basic sanitization
    let sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Escape HTML if requested
    if (options.escapeHtml !== false) {
      sanitized = validator.escape(sanitized);
    }
    
    // Normalize whitespace if requested
    if (options.normalizeWhitespace !== false) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }
    
    return sanitized;
  }

  /**
   * Validates project name
   * @param {string} name - Project name to validate
   * @returns {string} Validated and sanitized project name
   */
  validateProjectName(name) {
    // Validate and sanitize string
    const sanitizedName = this.validateAndSanitizeString(name, {
      escapeHtml: true,
      normalizeWhitespace: true,
    });
    
    // Check if name is empty after sanitization
    if (!sanitizedName || sanitizedName.length === 0) {
      throw new Error('Project name cannot be empty');
    }
    
    // Check length limits
    if (sanitizedName.length > 200) {
      throw new Error('Project name cannot exceed 200 characters');
    }
    
    return sanitizedName;
  }

  /**
   * Validates framework type
   * @param {string} framework - Framework type to validate
   * @returns {string} Validated framework type
   */
  validateFrameworkType(framework) {
    // Validate and sanitize string
    const sanitizedFramework = this.validateAndSanitizeString(framework, {
      escapeHtml: true,
      normalizeWhitespace: false,
    });
    
    // Check if framework is empty after sanitization
    if (!sanitizedFramework || sanitizedFramework.length === 0) {
      throw new Error('Framework type cannot be empty');
    }
    
    // Validate against allowed frameworks
    const allowedFrameworks = [
      'PROJECT_DEEPDIVE',
      'PROJECT_SYNTHETIC',
      'PROJECT_BENCHMARK',
    ];
    
    if (!allowedFrameworks.includes(sanitizedFramework)) {
      throw new Error(`Invalid framework. Must be one of: ${allowedFrameworks.join(', ')}`);
    }
    
    return sanitizedFramework;
  }

  /**
   * Validates project ID format
   * @param {string} id - Project ID to validate
   * @returns {string} Validated project ID
   */
  validateProjectId(id) {
    // Validate and sanitize string
    const sanitizedId = this.validateAndSanitizeString(id, {
      escapeHtml: true,
      normalizeWhitespace: false,
    });
    
    // Check if ID is empty after sanitization
    if (!sanitizedId || sanitizedId.length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    
    // Validate UUID format (version 4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(sanitizedId)) {
      throw new Error('Invalid project ID format');
    }
    
    return sanitizedId;
  }

  /**
   * Validates and sanitizes project updates
   * @param {Object} updates - Project updates to validate
   * @returns {Object} Validated and sanitized updates
   */
  validateProjectUpdates(updates) {
    // Check if updates is an object
    if (!updates || typeof updates !== 'object') {
      throw new Error('Project updates must be an object');
    }
    
    // Check for forbidden fields
    const forbiddenFields = [
      '_id',
      '__v',
      'createdAt',
      'deletedAt',
      'version',
    ];
    
    // Create sanitized updates object
    const sanitizedUpdates = {};
    
    // Process each field
    for (const [key, value] of Object.entries(updates)) {
      // Skip forbidden fields
      if (forbiddenFields.includes(key)) {
        console.warn(`Skipping forbidden field: ${key}`);
        continue;
      }
      
      // Validate based on field type
      switch (key) {
        case 'name':
          sanitizedUpdates.name = this.validateProjectName(value);
          break;
          
        case 'framework':
          sanitizedUpdates.framework = this.validateFrameworkType(value);
          break;
          
        case 'sourceContext':
        case 'generatedContent':
          // Validate string fields
          if (typeof value === 'string') {
            // Check length limits
            if (value.length > this.thresholds.maxInputLength) {
              throw new Error(`Field ${key} exceeds maximum length of ${this.thresholds.maxInputLength} characters`);
            }
            
            // Sanitize string
            sanitizedUpdates[key] = this.validateAndSanitizeString(value, {
              escapeHtml: false, // Keep HTML for content fields
              normalizeWhitespace: false,
            });
          } else {
            throw new Error(`Field ${key} must be a string`);
          }
          break;
          
        case 'status':
          // Validate status
          const validStatuses = [
            'New',
            'In Progress',
            'Completed',
            'Failed',
            'Cancelled',
          ];
          
          if (typeof value === 'string' && validStatuses.includes(value)) {
            sanitizedUpdates.status = value;
          } else {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
          }
          break;
          
        case 'generationMetadata':
          // Validate metadata object
          if (value === null || typeof value === 'object') {
            sanitizedUpdates.generationMetadata = value;
          } else {
            throw new Error('Generation metadata must be an object or null');
          }
          break;
          
        default:
          // For other fields, just validate they're strings or numbers
          if (typeof value === 'string') {
            sanitizedUpdates[key] = this.validateAndSanitizeString(value, {
              escapeHtml: true,
              normalizeWhitespace: true,
            });
          } else if (typeof value === 'number') {
            sanitizedUpdates[key] = value;
          } else {
            throw new Error(`Invalid field type for ${key}: ${typeof value}`);
          }
      }
    }
    
    return sanitizedUpdates;
  }

  /**
   * Validates HTTP headers for security
   * @param {Object} headers - HTTP headers to validate
   * @returns {Object} Validated headers
   */
  validateHeaders(headers) {
    // Check if headers is an object
    if (!headers || typeof headers !== 'object') {
      throw new Error('Headers must be an object');
    }
    
    // Create sanitized headers object
    const sanitizedHeaders = {};
    
    // Process each header
    for (const [key, value] of Object.entries(headers)) {
      // Validate header name
      if (typeof key !== 'string' || !key.match(/^[a-zA-Z0-9\-]+$/)) {
        console.warn(`Skipping invalid header name: ${key}`);
        continue;
      }
      
      // Validate header value
      if (typeof value === 'string') {
        // Check length limits
        if (value.length > 10000) {
          throw new Error(`Header ${key} value exceeds maximum length of 10,000 characters`);
        }
        
        // Sanitize header value
        sanitizedHeaders[key.toLowerCase()] = this.validateAndSanitizeString(value, {
          escapeHtml: true,
          normalizeWhitespace: true,
        });
      } else if (typeof value === 'number') {
        sanitizedHeaders[key.toLowerCase()] = String(value);
      } else {
        console.warn(`Skipping invalid header value type for ${key}: ${typeof value}`);
      }
    }
    
    return sanitizedHeaders;
  }

  /**
   * Prevents ReDoS (Regular Expression Denial of Service) attacks
   * @param {string} text - Text to match against pattern
   * @param {RegExp} pattern - Regular expression pattern
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Array|null>} Match result or null if timeout/error
   */
  async safeMatch(text, pattern, timeoutMs = this.thresholds.regexTimeout) {
    return new Promise((resolve, reject) => {
      // Set timeout to prevent ReDoS
      const timeout = setTimeout(() => {
        reject(new Error('Regex timeout - potential ReDoS attack'));
      }, timeoutMs);
      
      try {
        // Perform regex match
        const result = text.match(pattern);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Creates rate limiting middleware
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  createRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests from this IP, please try again later.',
      standardHeaders = true,
      legacyHeaders = false,
    } = options;
    
    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders,
      legacyHeaders,
    });
  }

  /**
   * Creates strict rate limiting middleware for sensitive endpoints
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  createStrictRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 10, // limit each IP to 10 requests per windowMs
      message = 'Too many requests from this IP. Please try again later.',
      standardHeaders = true,
      legacyHeaders = false,
    } = options;
    
    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders,
      legacyHeaders,
    });
  }

  /**
   * Creates generation rate limiting middleware
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  createGenerationRateLimiter(options = {}) {
    const {
      windowMs = 60 * 60 * 1000, // 1 hour
      max = 5, // limit each IP to 5 generation requests per hour
      message = 'Generation rate limit exceeded. Please try again later.',
      standardHeaders = true,
      legacyHeaders = false,
    } = options;
    
    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders,
      legacyHeaders,
    });
  }

  /**
   * Validates request depth and complexity to prevent DoS attacks
   * @param {Object} obj - Object to validate
   * @param {number} depth - Current depth (internal use)
   * @param {number} keys - Current key count (internal use)
   * @returns {boolean} True if valid, false if invalid
   */
  validateObjectComplexity(obj, depth = 0, keys = 0) {
    // Check depth limit
    if (depth > this.thresholds.maxDepth) {
      return false;
    }
    
    // Check if object
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const objKeys = Object.keys(obj);
      keys += objKeys.length;
      
      // Check key limit
      if (keys > this.thresholds.maxKeys) {
        return false;
      }
      
      // Recursively check nested objects
      for (const key of objKeys) {
        if (!this.validateObjectComplexity(obj[key], depth + 1, keys)) {
          return false;
        }
      }
    }
    
    // Check if array
    if (Array.isArray(obj)) {
      // Check array length limit
      if (obj.length > this.thresholds.maxArrayLength) {
        return false;
      }
      
      // Recursively check array items
      for (const item of obj) {
        if (!this.validateObjectComplexity(item, depth + 1, keys)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Sanitizes user input to prevent injection attacks
   * @param {any} input - User input to sanitize
   * @returns {any} Sanitized input
   */
  sanitizeInput(input) {
    // Handle null/undefined
    if (input === null || input === undefined) {
      return input;
    }
    
    // Handle strings
    if (typeof input === 'string') {
      return this.validateAndSanitizeString(input, {
        escapeHtml: true,
        normalizeWhitespace: true,
      });
    }
    
    // Handle numbers
    if (typeof input === 'number') {
      return input;
    }
    
    // Handle booleans
    if (typeof input === 'boolean') {
      return input;
    }
    
    // Handle arrays
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    // Handle objects
    if (typeof input === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    // For other types, convert to string and sanitize
    return this.validateAndSanitizeString(String(input), {
      escapeHtml: true,
      normalizeWhitespace: true,
    });
  }

  /**
   * Gets security metrics
   * @returns {Object} Security metrics
   */
  getSecurityMetrics() {
    // Get performance metrics related to security
    const perfMetrics = performanceMonitor.getMetrics();
    
    return {
      requestsBlocked: perfMetrics.errors, // Using errors as proxy for blocked requests
      activeSecurityChecks: 0, // Placeholder for future implementation
      totalSecurityEvents: perfMetrics.totalRequests, // Using total requests as proxy
      securityStatus: perfMetrics.status,
      thresholds: this.thresholds,
    };
  }

  /**
   * Updates security thresholds
   * @param {Object} newThresholds - New threshold values
   * @returns {void}
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('🔧 Security thresholds updated:', this.thresholds);
  }
}

// Export singleton instance
module.exports = new SecurityService();