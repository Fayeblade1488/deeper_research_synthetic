/**
 * @file Project routes
 * @description REST API routes for Project endpoints
 */

const express = require('express');
const router = express.Router();

const ProjectController = require('./ProjectController');
const { 
  validateProjectCreation, 
  validateProjectId, 
  validateProjectUpdate,
  validatePagination
} = require('../middleware/validation');

/**
 * GET /api/v1/projects
 * Get all projects with optional pagination
 */
router.get('/', validatePagination, ProjectController.getAllProjects);

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', validateProjectCreation, ProjectController.createProject);

/**
 * GET /api/v1/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', validateProjectId, ProjectController.getProjectById);

/**
 * PUT /api/v1/projects/:id
 * Update a specific project
 */
router.put('/:id', validateProjectId, validateProjectUpdate, ProjectController.updateProject);

/**
 * DELETE /api/v1/projects/:id
 * Delete a specific project
 */
router.delete('/:id', validateProjectId, ProjectController.deleteProject);

/**
 * PUT /api/v1/projects/:id/context
 * Update project source context
 */
router.put('/:id/context', validateProjectId, ProjectController.updateProjectContext);

/**
 * PUT /api/v1/projects/:id/content
 * Update generated content
 */
router.put('/:id/content', validateProjectId, ProjectController.updateGeneratedContent);

/**
 * GET /api/v1/projects/framework/:framework
 * Get projects by framework with optional pagination
 */
router.get('/framework/:framework', validatePagination, ProjectController.getProjectsByFramework);

/**
 * GET /api/v1/projects/status/:status
 * Get projects by status with optional pagination
 */
router.get('/status/:status', validatePagination, ProjectController.getProjectsByStatus);

/**
 * GET /api/v1/projects/stats
 * Get project statistics
 */
router.get('/stats', ProjectController.getProjectStats);

module.exports = router;