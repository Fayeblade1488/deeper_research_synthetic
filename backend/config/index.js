/**
 * @file Configuration management for the application
 * @description Centralized configuration management with environment variable support
 */

// Load environment variables
require('dotenv').config();

/**
 * Application configuration
 */
const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/deeper_research',
    dialect: process.env.DB_DIALECT || 'mongodb',
  },

  // AI Provider configuration
  ai: {
    provider: process.env.AI_PROVIDER || process.env.PROVIDER || 'venice',
    venice: {
      apiKey: process.env.VENICE_API_KEY,
      baseUrl: process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    },
    // Common AI parameters
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.MAX_OUTPUT_TOKENS) || 32000,
    topP: parseFloat(process.env.TOP_P) || 0.95,
    topK: parseInt(process.env.TOP_K) || 40,
  },

  // Security configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Performance monitoring
  performance: {
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB) || 512,
    maxActiveGenerations: parseInt(process.env.MAX_ACTIVE_GENERATIONS) || 10,
    maxErrorRate: parseFloat(process.env.MAX_ERROR_RATE) || 0.1,
    maxResponseTime: parseInt(process.env.MAX_RESPONSE_TIME) || 30000,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
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
}

module.exports = {
  config,
  validateConfig,
};