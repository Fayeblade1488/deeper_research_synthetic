/**
 * @file Health check routes
 * @description REST API routes for health check endpoints
 */

const express = require('express');
const router = express.Router();

const HealthController = require('./HealthController');

/**
 * GET /api/v1/health
 * Get server health status
 */
router.get('/', HealthController.getHealth);

/**
 * GET /api/v1/health/metrics
 * Get server performance metrics
 */
router.get('/metrics', HealthController.getMetrics);

/**
 * POST /api/v1/health/report
 * Generate performance report
 */
router.post('/report', HealthController.generateReport);

/**
 * PUT /api/v1/health/thresholds
 * Update performance thresholds
 */
router.put('/thresholds', HealthController.updateThresholds);

module.exports = router;