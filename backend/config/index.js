/**
 * @file Configuration management for the application
 * @description Centralized configuration management with environment variable support
 */

// Load environment variables
require('dotenv').config();

/**
 * Utility function to safely parse environment variables with validation
 */
function getEnvNumber(key, defaultValue, min, max) {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`${key} must be a valid number, got: ${value}`);
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`${key} must be >= ${min}, got: ${num}`);
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`${key} must be <= ${max}, got: ${num}`);
  }
  
  return num;
}

function getEnvFloat(key, defaultValue, min, max) {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`${key} must be a valid number, got: ${value}`);
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`${key} must be >= ${min}, got: ${num}`);
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`${key} must be <= ${max}, got: ${num}`);
  }
  
  return num;
}

function getEnvString(key, defaultValue, allowedValues = null) {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`${key} is required but not set`);
  }
  
  if (allowedValues && !allowedValues.includes(value)) {
    throw new Error(`${key} must be one of [${allowedValues.join(', ')}], got: ${value}`);
  }
  
  return value;
}

function getEnvBoolean(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Application configuration
 */
const config = {
  // Server configuration
  server: {
    port: getEnvNumber('PORT', 3001, 1024, 65535),
    host: process.env.HOST || 'localhost',
    nodeEnv: getEnvString('NODE_ENV', 'development', ['development', 'staging', 'production']),
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/deeper_research',
    dialect: getEnvString('DB_DIALECT', 'mongodb', ['mongodb']),
  },

  // AI Provider configuration
  ai: {
    provider: getEnvString('AI_PROVIDER', process.env.PROVIDER || 'venice', ['venice', 'gemini']),
    venice: {
      apiKey: process.env.VENICE_API_KEY,
      baseUrl: process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    },
    // Common AI parameters with validation
    temperature: getEnvFloat('TEMPERATURE', 0.7, 0, 2),
    maxTokens: getEnvNumber('MAX_OUTPUT_TOKENS', 32000, 1000, 100000),
    topP: getEnvFloat('TOP_P', 0.95, 0, 1),
    topK: getEnvNumber('TOP_K', 40, 1, 100),
  },

  // Security configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: getEnvBoolean('CORS_CREDENTIALS', false),
    },
    rateLimiting: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, 1000, 3600000),
      max: getEnvNumber('RATE_LIMIT_MAX', 100, 1, 10000),
    },
  },

  // Performance monitoring
  performance: {
    maxMemoryMB: getEnvNumber('MAX_MEMORY_MB', 512, 128, 4096),
    maxActiveGenerations: getEnvNumber('MAX_ACTIVE_GENERATIONS', 10, 1, 100),
    maxErrorRate: getEnvFloat('MAX_ERROR_RATE', 0.1, 0, 1),
    maxResponseTime: getEnvNumber('MAX_RESPONSE_TIME', 30000, 1000, 300000),
  },

  // Logging configuration
  logging: {
    level: getEnvString('LOG_LEVEL', 'info', ['debug', 'info', 'warn', 'error']),
    format: getEnvString('LOG_FORMAT', 'json', ['json', 'text']),
  },
};

/**
 * Validate configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  // Validate required environment variables
  const required = [];
  
  // For Venice provider, API key is required
  if (config.ai.provider === 'venice' && !config.ai.venice.apiKey) {
    required.push('VENICE_API_KEY');
  }
  
  // For Gemini provider, API key is required
  if (config.ai.provider === 'gemini' && !config.ai.gemini.apiKey) {
    required.push('GEMINI_API_KEY');
  }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
  
  // Validate config is complete
  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }
}

module.exports = {
  config,
  validateConfig,
  getEnvNumber,
  getEnvFloat,
  getEnvString,
  getEnvBoolean,
};