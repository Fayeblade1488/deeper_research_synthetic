/**
 * THE FORGE - Backend Server for Initiative: IRONCLAD
 * 
 * This is the main Express.js server that provides API endpoints for
 * the Deeper Research Synthetic project. It handles project management,
 * content generation, and serves as the backend for "THE LENS" frontend.
 * 
 * @author Paradroid AI
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- In-Memory Database ---
/** @type {Array<Object>} Array of project objects stored in memory */
let projects = [];

/** @type {Map<string, Promise>} Map of active project update operations for concurrency control */
const projectUpdateLocks = new Map();

/**
 * Acquire a lock for project updates to prevent race conditions
 * 
 * @param {string} projectId - The project ID to lock
 * @returns {Promise<Function>} Promise resolving to unlock function
 */
function acquireProjectLock(projectId) {
    // If there's already a lock, wait for it
    if (projectUpdateLocks.has(projectId)) {
        return projectUpdateLocks.get(projectId).then(() => acquireProjectLock(projectId));
    }
    
    // Create a new lock
    let releaseLock;
    const lockPromise = new Promise((resolve) => {
        releaseLock = () => {
            projectUpdateLocks.delete(projectId);
            resolve();
        };
    });
    
    projectUpdateLocks.set(projectId, lockPromise);
    
    // Return the release function immediately
    return Promise.resolve(releaseLock);
}

// --- Import Routes and Services ---
const generationRoutes = require('./routes/generation');
const { performanceMonitor } = require('./services/performanceService');

// --- API Routes for Projects ---

/**
 * GET /api/projects - Retrieve all projects
 * 
 * Returns a JSON array of all projects currently stored in memory.
 * Each project contains id, name, framework, sourceContext, generatedContent,
 * metadata, timestamps, and status.
 * 
 * @route GET /api/projects
 * @returns {Array<Object>} Array of project objects
 */
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

/**
 * POST /api/projects - Create a new project
 * 
 * Creates a new project with the specified name and framework type.
 * Generates a unique UUID for the project and initializes default values.
 * 
 * @route POST /api/projects
 * @param {string} req.body.name - The project name
 * @param {string} req.body.framework - Framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)
 * @returns {Object} The created project object
 * @throws {400} When name or framework is missing
 */
app.post('/api/projects', (req, res) => {
    const { name, framework } = req.body;
    if (!name || !framework) {
        return res.status(400).json({ error: 'Project name and framework are required.' });
    }
    const newProject = {
        id: crypto.randomUUID(),
        name,
        framework,
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New'
    };
    projects.push(newProject);
    console.log('Project Created:', newProject);
    res.status(201).json(newProject);
});

/**
 * GET /api/projects/:id - Retrieve a single project
 * 
 * Retrieves a specific project by its unique identifier.
 * 
 * @route GET /api/projects/:id
 * @param {string} req.params.id - The unique project ID
 * @returns {Object} The project object if found
 * @throws {404} When project with specified ID is not found
 */
app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(project);
});

/**
 * PUT /api/projects/:id - Update a project
 * 
 * Updates an existing project with new data using atomic operations to prevent race conditions.
 * The project ID cannot be changed. Updates the updatedAt timestamp automatically.
 * 
 * @route PUT /api/projects/:id
 * @param {string} req.params.id - The unique project ID
 * @param {Object} req.body - Project update data (sourceContext, generatedContent, etc.)
 * @returns {Object} The updated project object
 * @throws {404} When project with specified ID is not found
 */
app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    
    try {
        // Acquire lock for this project to prevent race conditions
        const releaseLock = await acquireProjectLock(projectId);
        
        try {
            // Find project with the lock held
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex === -1) {
                return res.status(404).json({ error: 'Project not found.' });
            }
            
            const originalProject = projects[projectIndex];
            
            // Create updated project with version tracking
            const updatedProject = {
                ...originalProject,
                ...req.body,
                id: originalProject.id, // Ensure ID cannot be changed
                version: (originalProject.version || 0) + 1, // Add version for optimistic locking
                updatedAt: new Date().toISOString(),
            };
            
            // Atomic update
            projects[projectIndex] = updatedProject;
            
            console.log('Project Updated:', updatedProject.id, 'version:', updatedProject.version);
            res.json(updatedProject);
            
        } finally {
            // Always release the lock
            releaseLock();
        }
        
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Internal server error during project update' });
    }
});

/**
 * DELETE /api/projects/:id - Delete a project
 * 
 * Permanently removes a project from memory. This action cannot be undone.
 * 
 * @route DELETE /api/projects/:id
 * @param {string} req.params.id - The unique project ID to delete
 * @returns {void} Empty response with 204 status code
 * @throws {404} When project with specified ID is not found
 */
app.delete('/api/projects/:id', (req, res) => {
    const projectIndex = projects.findIndex(p => p.id === req.params.id);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found.' });
    }
    projects.splice(projectIndex, 1);
    console.log('Project Deleted:', req.params.id);
    res.status(204).send();
});

// --- Generation Routes ---
app.use('/api/generate', generationRoutes);

// --- Server Status and Startup ---

/**
 * GET /api/status - Server health check and status
 * 
 * Provides information about the server's operational status,
 * current project count, and Gemini API configuration status.
 * Used by the frontend and monitoring tools to verify server health.
 * 
 * @route GET /api/status
 * @returns {Object} Server status object containing:
 *   - status: Operational status message
 *   - phase: Current operational phase
 *   - projectCount: Number of projects currently in memory
 *   - geminiConfigured: Boolean indicating if Gemini API key is configured
 */
app.get('/api/status', (req, res) => {
    const perfMetrics = performanceMonitor.getMetrics();
    
    res.json({ 
        status: 'THE FORGE is operational',
        phase: 'Operation COGNITION',
        projectCount: projects.length,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        performance: {
            status: perfMetrics.status,
            memory: perfMetrics.currentMemory,
            activeGenerations: perfMetrics.activeGenerations,
            totalRequests: perfMetrics.totalRequests,
            errorRate: perfMetrics.errors / Math.max(1, perfMetrics.totalRequests),
            uptime: perfMetrics.uptime
        }
    });
});

/**
 * GET /api/performance - Detailed performance metrics
 * 
 * Provides comprehensive performance monitoring data including:
 * - Memory usage trends and leak detection
 * - Request/response statistics
 * - Active generation tracking
 * - System health indicators
 * 
 * @route GET /api/performance
 * @returns {Object} Detailed performance metrics and system health data
 */
app.get('/api/performance', (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    res.json(metrics);
});

/**
 * POST /api/performance/report - Generate performance report
 * 
 * Triggers immediate generation of a comprehensive performance report.
 * Useful for debugging and monitoring system health.
 * 
 * @route POST /api/performance/report
 * @returns {Object} Complete performance report with analysis
 */
app.post('/api/performance/report', (req, res) => {
    const report = performanceMonitor.generatePerformanceReport();
    res.json(report);
});

/**
 * PUT /api/performance/thresholds - Update performance thresholds
 * 
 * Allows dynamic adjustment of performance monitoring thresholds.
 * Useful for tuning alerts and monitoring sensitivity.
 * 
 * @route PUT /api/performance/thresholds
 * @param {Object} req.body - New threshold values
 * @returns {Object} Updated threshold configuration
 */
app.put('/api/performance/thresholds', (req, res) => {
    performanceMonitor.updateThresholds(req.body);
    res.json({ 
        message: 'Performance thresholds updated', 
        thresholds: performanceMonitor.thresholds 
    });
});

/**
 * Start the Express server
 * 
 * Initializes the server on the specified port and displays startup information.
 * Includes system status, configuration details, and operational readiness indicators.
 */
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`  THE FORGE - Initiative: IRONCLAD`);
    console.log(`  Phase: Operation COGNITION`);
    console.log(`  Status: ONLINE`);
    console.log(`==============================================`);
    console.log(`  Server: http://localhost:${PORT}`);
    console.log(`  Gemini API: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    console.log(`==============================================\n`);
    console.log('Awaiting instructions from THE LENS...\n');
});
