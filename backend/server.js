/**
 * @file This file is the main entry point for the backend server of the Deeper Research Synthetic project, also known as "THE FORGE".
 * @author Paradroid AI
 * @version 2.0.0
 *
 * @description This Express.js server provides a RESTful API for managing projects, generating content, and monitoring server performance.
 * It serves as the backend for "THE LENS" frontend application.
 * The server now uses a modular architecture with database persistence and follows REST conventions.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import configuration and utilities
const { config, validateConfig } = require("./config");
const database = require("./data");
const logger = require("./utils/logger");

// Import middleware
const { notFoundHandler, errorHandler } = require("./api/v1/middleware/error-handler");

// Import API routes
const apiV1Routes = require("./api/v1");

const app = express();

// --- Security Middleware ---

// CORS configuration
app.use(cors(config.security.cors));

// Request size limit (BUG-009 fix)
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  limit: '10mb',
  extended: true 
}));

// Request size validation middleware
app.use((req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    logger.warn('Request exceeds size limit', {
      ip: req.ip,
      size: contentLength,
      limit: maxSize
    });
    return res.status(413).json({
      success: false,
      error: 'Payload too large',
      message: `Request size exceeds ${maxSize / 1024 / 1024}MB limit`
    });
  }
  next();
});

// Rate limiting (BUG-012 fix)
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
let rateLimitStore;

// Try to use Redis if available, otherwise use memory store
try {
  const redis = require('redis');
  const client = redis.createClient({ url: process.env.REDIS_URL });
  rateLimitStore = new RedisStore({
    client: client,
    prefix: 'rl:' // rate limit prefix
  });
  logger.info('Rate limiting: Using Redis store');
} catch (e) {
  logger.info('Rate limiting: Using memory store (Redis not available)');
  // Falls back to memory store (not suitable for production clusters)
}

const generalLimiter = rateLimit({
  store: rateLimitStore,
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.max,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  statusCode: 429,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health' || req.path === '/health';
  }
});

// Stricter rate limiting for auth endpoints (if added)
const authLimiter = rateLimit({
  store: rateLimitStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  statusCode: 429,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict limiting for generation endpoints
const generationLimiter = rateLimit({
  store: rateLimitStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 generation requests per hour
  message: {
    success: false,
    error: 'Generation rate limit exceeded',
    message: 'Maximum generations per hour reached. Please try again later.'
  },
  statusCode: 429,
});

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`${req.method} ${req.url}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp,
    contentLength: req.get('content-length') || 'unset'
  });
  
  // Log when response finishes
  res.on('finish', () => {
    logger.info(`${req.method} ${req.url} - Status: ${res.statusCode}`, {
      timestamp,
      duration: res.get('X-Response-Time') || 'unknown'
    });
  });
  
  next();
});

// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
  });
  next();
});

// --- API Routes ---

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Generation endpoint with stricter rate limiting
app.use('/api/v1/generate', generationLimiter);

// Mount API v1 routes
app.use("/api/v1", apiV1Routes);

// Legacy API routes for backward compatibility
app.use("/api/projects", apiV1Routes);
app.use("/api/generate", apiV1Routes);
app.use("/api/status", apiV1Routes);
app.use("/api/performance", apiV1Routes);

// --- Server Status and Startup ---

/**
 * @route GET /
 * @description Root endpoint that redirects to API documentation or health check
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 *
 * @returns {void}
 */
app.get("/", (req, res) => {
  res.redirect("/api/v1/health");
});

/**
 * Starts the Express server and listens for incoming connections on the specified port.
 * It logs a startup message to the console with information about the server's status and configuration.
 *
 * @param {number} PORT - The port number on which the server will listen.
 * @param {Function} callback - A callback function that is executed once the server has successfully started.
 */
async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    // Get AI provider info
    const ProviderFactory = require("./services/providers/ProviderFactory");
    let providerInfo = "Not configured";
    try {
      const provider = ProviderFactory.createFromEnv();
      const info = provider.getInfo();
      providerInfo = `${info.name} (${
        info.privacyFocused ? "🔒 Privacy-First" : "Standard"
      })`;
    } catch (error) {
      providerInfo = `Error: ${error.message}`;
    }

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`==============================================`);
      logger.info(`  THE FORGE - Initiative: IRONCLAD`);
      logger.info(`  Phase: Operation COGNITION`);
      logger.info(`  Status: ONLINE`);
      logger.info(`==============================================`);
      logger.info(`  Server: http://localhost:${config.server.port}`);
      logger.info(`  AI Provider: ${providerInfo}`);
      logger.info(`==============================================\n`);
      logger.info("Awaiting instructions from THE LENS...\n");
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await database.disconnect();
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await database.disconnect();
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { reason: reason.message, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});
