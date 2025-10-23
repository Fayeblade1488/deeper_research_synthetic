/**
 * @file Generation routes
 * @description REST API routes for content generation endpoints
 */

const express = require('express');
const router = express.Router();

const GenerationController = require('./GenerationController');
const { validateProjectId } = require('../middleware/validation');

/**
 * OPTIONS /api/v1/generate/:id
 * Handle CORS preflight requests
 */
router.options('/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache
  res.status(204).end();
});

/**
 * POST /api/v1/generate/:id
 * Start content generation for a project using Server-Sent Events
 */
router.post('/:id', validateProjectId, GenerationController.startGeneration);

/**
 * GET /api/v1/generate/:id/status
 * Get generation status for a project
 */
router.get('/:id/status', validateProjectId, GenerationController.getGenerationStatus);

/**
 * DELETE /api/v1/generate/:id
 * Cancel active generation for a project
 */
router.delete('/:id', validateProjectId, GenerationController.cancelGeneration);

/**
 * PUT /api/v1/generate/:id/content
 * Update generated content for a project
 */
router.put('/:id/content', validateProjectId, GenerationController.updateGeneratedContent);

module.exports = router;