const express = require('express');
const router = express.Router();
const { generateContent } = require('../services/generationService');
const { performanceMonitor } = require('../services/performanceService');

// Store active generations (in-memory for now)
const activeGenerations = new Map();

/**
 * OPTIONS /api/generate/:projectId
 * Handle CORS preflight requests for POST generation
 */
router.options('/:projectId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache
    res.status(204).end();
});

/**
 * POST /api/generate/:projectId
 * Start content generation for a project with proper connection cleanup
 */
router.post('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { project } = req.body;
    
    if (!project) {
        return res.status(400).json({ error: 'Project data is required' });
    }
    
    // Check if generation is already in progress
    if (activeGenerations.has(projectId)) {
        return res.status(409).json({ error: 'Generation already in progress for this project' });
    }
    
    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.flushHeaders();
    
    // Connection cleanup function with race condition protection
    let cleanupExecuted = false;
    const cleanupConnection = () => {
        if (cleanupExecuted) {
            console.log(`Cleanup already executed for project ${projectId}`);
            return;
        }
        cleanupExecuted = true;
        activeGenerations.delete(projectId);
        console.log(`Cleaned up generation for project ${projectId}`);
    };
    
    // Handle client disconnection
    req.on('close', () => {
        console.log(`Client disconnected for project ${projectId}`);
        cleanupConnection();
    });
    
    req.on('aborted', () => {
        console.log(`Request aborted for project ${projectId}`);
        cleanupConnection();
    });
    
    // Set up connection timeout (30 minutes max)
    const connectionTimeout = setTimeout(() => {
        console.log(`Connection timeout for project ${projectId}`);
        cleanupConnection();
        res.end();
    }, 30 * 60 * 1000); // 30 minutes
    
    // Record performance metrics for generation start
    const perfMetrics = performanceMonitor.recordGenerationStart(projectId);
    
    // Mark generation as active with cleanup references
    activeGenerations.set(projectId, { 
        startTime: Date.now(), 
        status: 'running',
        timeout: connectionTimeout,
        cleanup: cleanupConnection,
        performanceMetrics: perfMetrics
    });
    
    // Enhanced progress callback with error handling
    const onProgress = (update) => {
        try {
            if (!res.destroyed && !res.finished) {
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        } catch (writeError) {
            console.error('Error writing to SSE stream:', writeError);
            cleanupConnection();
        }
    };
    
    try {
        // Start generation
        const result = await generateContent(project, onProgress);
        
        // Record successful completion
        const generation = activeGenerations.get(projectId);
        if (generation?.performanceMetrics) {
            performanceMonitor.recordGenerationComplete(
                projectId, 
                generation.performanceMetrics.startTime, 
                true
            );
        }
        
        // Send final result if connection is still alive
        if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify({
                type: 'complete',
                content: result.content,
                metadata: result.metadata,
            })}\n\n`);
        }
        
        res.end();
        
    } catch (error) {
        console.error('Generation error:', error);
        
        // Record error and failed completion
        const generation = activeGenerations.get(projectId);
        if (generation?.performanceMetrics) {
            performanceMonitor.recordGenerationComplete(
                projectId, 
                generation.performanceMetrics.startTime, 
                false
            );
        }
        performanceMonitor.recordError(error, { projectId, framework: project.framework });
        
        // Send error if connection is still alive
        if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: error.message,
            })}\n\n`);
        }
        
        res.end();
        
    } finally {
        // Clear timeout and clean up
        clearTimeout(connectionTimeout);
        cleanupConnection();
    }
});

/**
 * GET /api/generate/:projectId/status
 * Check generation status
 */
router.get('/:projectId/status', (req, res) => {
    const { projectId } = req.params;
    
    if (activeGenerations.has(projectId)) {
        const generation = activeGenerations.get(projectId);
        res.json({
            active: true,
            status: generation.status,
            startTime: generation.startTime,
            duration: Date.now() - generation.startTime,
        });
    } else {
        res.json({
            active: false,
        });
    }
});

/**
 * DELETE /api/generate/:projectId
 * Cancel active generation with proper cleanup
 */
router.delete('/:projectId', (req, res) => {
    const { projectId } = req.params;
    
    if (activeGenerations.has(projectId)) {
        const generation = activeGenerations.get(projectId);
        
        // Clear the timeout before deletion to prevent memory leak
        if (generation.timeout) {
            clearTimeout(generation.timeout);
        }
        
        // Call cleanup function if present
        if (generation.cleanup) {
            generation.cleanup();
        }
        
        activeGenerations.delete(projectId);
        res.json({ message: 'Generation cancelled' });
    } else {
        res.status(404).json({ error: 'No active generation found' });
    }
});

module.exports = router;
