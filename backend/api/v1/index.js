/**
 * @file API v1 routes index
 * @description Main entry point for API v1 routes
 */

const express = require('express');
const router = express.Router();

// Import route handlers
const projectRoutes = require('./routes/projects');
const generationRoutes = require('./routes/generation');
const healthRoutes = require('./routes/health');

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

/**
 * API v1 routes
 */

// Health check endpoints
router.use('/health', healthRoutes);

// Mount route handlers
router.use('/projects', projectRoutes);
router.use('/generate', generationRoutes);

// Legacy health check endpoint for backward compatibility
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Catch-all for undefined routes
router.use('*', notFoundHandler);

// Error handling middleware (must be last)
router.use(errorHandler);

module.exports = router;