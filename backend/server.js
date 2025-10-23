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

// --- Middleware ---
app.use(cors(config.security.cors));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`${req.method} ${req.url}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp 
  });
  
  // Log when response finishes
  res.on('finish', () => {
    logger.info(`${req.method} ${req.url} - Status: ${res.statusCode}`, {
      timestamp
    });
  });
  
  next();
});

// --- API Routes ---

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
