/**
 * @file This file is the main entry point for the backend server of the Deeper Research Synthetic project, also known as "THE FORGE".
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This Express.js server provides a RESTful API for managing projects, generating content, and monitoring server performance.
 * It serves as the backend for "THE LENS" frontend application.
 * The server maintains an in-memory database for projects and uses a locking mechanism to handle concurrent updates.
 * It also integrates with a performance monitoring service to track server health and resource usage.
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
 * Acquires a lock for a specific project to prevent race conditions during updates.
 * This function ensures that only one update operation can be performed on a project at a time.
 * If a lock is already held for the requested project, the function will wait until the lock is released before acquiring a new one.
 *
 * @param {string} projectId - The unique identifier of the project to lock.
 * @returns {Promise<Function>} A Promise that resolves to a `releaseLock` function. This function must be called to release the lock once the update operation is complete.
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
 * @route GET /api/projects
 * @description Retrieves a list of all projects currently stored in the in-memory database.
 * Each project object in the returned array contains detailed information about the project.
 * 
 * @returns {void}
 * 
 * @response {200} {Array<Object>} An array of project objects. Each object includes:
 * - {string} id - The unique identifier for the project.
 * - {string} name - The name of the project.
 * - {string} framework - The framework type of the project (e.g., PROJECT_DEEPDIVE).
 * - {string} sourceContext - The source context or input for the project.
 * - {string} generatedContent - The content generated for the project.
 * - {Object} generationMetadata - Metadata related to the content generation process.
 * - {string} createdAt - The ISO 8601 timestamp of when the project was created.
 * - {string} updatedAt - The ISO 8601 timestamp of when the project was last updated.
 * - {string} status - The current status of the project (e.g., 'New', 'In Progress', 'Completed').
 */
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

/**
 * @route POST /api/projects
 * @description Creates a new project with a specified name and framework type.
 * A unique UUID is generated for the project, and default values are initialized for its properties.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing the project details.
 * @param {string} req.body.name - The name of the project. This is a required field.
 * @param {string} req.body.framework - The framework type for the project (e.g., PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK). This is a required field.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {201} {Object} The newly created project object.
 * @response {400} {Object} An error object indicating that the project name or framework is missing.
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
 * @route GET /api/projects/:id
 * @description Retrieves a single project by its unique identifier.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.id - The unique identifier of the project to retrieve.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} The project object with the specified ID.
 * @response {404} {Object} An error object indicating that the project was not found.
 */
app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(project);
});

/**
 * @route PUT /api/projects/:id
 * @description Updates an existing project with new data.
 * This endpoint uses a locking mechanism to ensure atomic updates and prevent race conditions.
 * The project's `updatedAt` timestamp is automatically updated, and a version number is incremented for optimistic locking.
 * The project ID cannot be changed.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.id - The unique identifier of the project to update.
 * @param {Object} req.body - The request body containing the new data for the project.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} The updated project object.
 * @response {404} {Object} An error object indicating that the project was not found.
 * @response {500} {Object} An error object indicating an internal server error occurred during the update process.
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
 * @route DELETE /api/projects/:id
 * @description Permanently deletes a project from the in-memory database.
 * This action is irreversible.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.id - The unique identifier of the project to delete.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {204} - An empty response indicating that the project was successfully deleted.
 * @response {404} {Object} An error object indicating that the project was not found.
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
 * @route GET /api/status
 * @description Provides a health check and status report for the server.
 * This endpoint is used by the frontend and monitoring tools to verify that the server is operational.
 * It returns information about the server's status, the number of projects, and the status of the Gemini API configuration.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} A server status object with the following properties:
 * - {string} status - An operational status message (e.g., 'THE FORGE is operational').
 * - {string} phase - The current operational phase of the server (e.g., 'Operation COGNITION').
 * - {number} projectCount - The number of projects currently stored in memory.
 * - {boolean} geminiConfigured - A boolean indicating whether the Gemini API key is configured.
 * - {Object} performance - An object containing performance metrics from the `performanceMonitor` service.
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
 * @route GET /api/performance
 * @description Retrieves detailed performance metrics from the `performanceMonitor` service.
 * This endpoint provides a comprehensive overview of the server's performance, including memory usage, request statistics, and system health.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} An object containing detailed performance metrics.
 */
app.get('/api/performance', (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    res.json(metrics);
});

/**
 * @route POST /api/performance/report
 * @description Triggers the immediate generation of a comprehensive performance report.
 * This is useful for debugging and on-demand monitoring of the system's health.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} A complete performance report with analysis.
 */
app.post('/api/performance/report', (req, res) => {
    const report = performanceMonitor.generatePerformanceReport();
    res.json(report);
});

/**
 * @route PUT /api/performance/thresholds
 * @description Allows for the dynamic adjustment of performance monitoring thresholds.
 * This is useful for tuning alerts and monitoring sensitivity based on the server's workload.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing the new threshold values.
 * @param {Object} res - The Express response object.
 * 
 * @returns {void}
 * 
 * @response {200} {Object} An object containing a confirmation message and the updated threshold configuration.
 */
app.put('/api/performance/thresholds', (req, res) => {
    performanceMonitor.updateThresholds(req.body);
    res.json({ 
        message: 'Performance thresholds updated', 
        thresholds: performanceMonitor.thresholds 
    });
});

/**
 * Starts the Express server and listens for incoming connections on the specified port.
 * It logs a startup message to the console with information about the server's status and configuration.
 * 
 * @param {number} PORT - The port number on which the server will listen.
 * @param {Function} callback - A callback function that is executed once the server has successfully started.
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
