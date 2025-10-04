const API_URL = 'http://localhost:3001/api';

/**
 * @file This file contains the API service for "THE LENS" frontend, which handles all communication with "THE FORGE" backend.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This service provides a set of functions for interacting with the backend API.
 * It includes functions for performing CRUD operations on projects, starting and managing content generation with Server-Sent Events, and checking the server's health and status.
 */

// --- Project CRUD Operations ---

/**
 * Fetches a complete list of all projects from the backend.
 * This function is used to populate the project list in the application's sidebar.
 *
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of project objects.
 * @throws {Error} Throws an error if the fetch request fails or the server returns an error response.
 */
export async function fetchProjects() {
    const response = await fetch(`${API_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
}

/**
 * Creates a new project with a specified name and framework.
 * This function sends a POST request to the backend, where a unique ID and default values will be generated for the new project.
 *
 * @param {string} name - The name of the new project.
 * @param {string} framework - The framework type for the new project (e.g., PROJECT_DEEPDIVE).
 * @returns {Promise<Object>} A Promise that resolves to the newly created project object.
 * @throws {Error} Throws an error if the project creation fails or if there are validation errors.
 */
export async function createProject(name, framework) {
    const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, framework }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

/**
 * Updates an existing project with new data.
 * This function sends a PUT request to the backend with the fields to be updated.
 * Only the fields provided in the `updates` object will be modified. The project ID cannot be changed.
 *
 * @param {string} projectId - The unique identifier of the project to update.
 * @param {Object} updates - An object containing the fields to be updated.
 * @returns {Promise<Object>} A Promise that resolves to the updated project object.
 * @throws {Error} Throws an error if the update fails or if the project is not found.
 */
export async function updateProject(projectId, updates) {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
}

/**
 * Permanently deletes a project from the backend.
 * This action is irreversible and will remove the project and all its associated data.
 *
 * @param {string} projectId - The unique identifier of the project to delete.
 * @returns {Promise<void>} A Promise that resolves when the deletion is complete.
 * @throws {Error} Throws an error if the deletion fails or if the project is not found.
 */
export async function deleteProject(projectId) {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
}

// --- Generation Operations ---

/**
 * Starts the content generation process for a project using Server-Sent Events (SSE) for real-time updates.
 * This function handles the entire lifecycle of the generation stream, including starting the connection, processing incoming data, and handling errors with a retry mechanism.
 *
 * @param {Object} project - The project object for which to generate content.
 * @param {Function} onProgress - A callback function that is invoked with progress updates.
 * @param {Function} onComplete - A callback function that is invoked when the generation is complete.
 * @param {Function} onError - A callback function that is invoked when an error occurs.
 * @returns {Function} A `cleanup` function that can be called to manually cancel the generation stream.
 */
export function startGeneration(project, onProgress, onComplete, onError) {
    // Track the active stream reader for cleanup
    let reader = null;
    let isStreamActive = true;
    
    /**
     * Cleanup function to safely terminate the stream
     */
    const cleanup = () => {
        isStreamActive = false;
        if (reader) {
            reader.cancel().catch(err => {
                console.warn('Error canceling stream reader:', err);
            });
            reader = null;
        }
    };
    
    /**
     * Enhanced error handling with retry logic
     * @param {Error} error - The error that occurred
     * @param {number} retryCount - Current retry attempt (default: 0)
     */
    const handleError = (error, retryCount = 0) => {
        console.error('Generation stream error:', error);
        
        // Clean up the current stream
        cleanup();
        
        // Determine if error is retryable (expanded to include HTTP 5xx errors)
        const isRetryableError = (
            error.name === 'TypeError' || // Network errors
            error.name === 'AbortError' || // Aborted requests
            error.message.includes('network') ||
            error.message.includes('fetch') ||
            error.message.includes('HTTP 5') || // 5xx server errors
            error.message.includes('timeout') ||
            error.message.includes('503') || // Service unavailable
            error.message.includes('502') || // Bad gateway
            error.message.includes('504')    // Gateway timeout
        );
        
        // Implement exponential backoff retry for retryable errors
        if (isRetryableError && retryCount < 3) {
            const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`Retrying generation in ${backoffDelay}ms (attempt ${retryCount + 1}/3)`);
            
            setTimeout(() => {
                if (isStreamActive) { // Only retry if stream wasn't manually cancelled
                    startGenerationInternal(retryCount + 1);
                }
            }, backoffDelay);
        } else {
            // Non-retryable error or max retries exceeded
            onError(error.message || 'Generation failed');
        }
    };
    
    /**
     * Internal function to start generation with retry support
     * @param {number} retryCount - Current retry attempt
     */
    const startGenerationInternal = (retryCount = 0) => {
        if (!isStreamActive) {
            return; // Stream was cancelled
        }
        
        fetch(`${API_URL}/generate/${project.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to start generation`);
            }
            
            if (!response.body) {
                throw new Error('Response body is not available for streaming');
            }
            
            reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = '';
            
            /**
             * Process the SSE stream with comprehensive error handling
             */
            function processStream() {
                if (!isStreamActive || !reader) {
                    return; // Stream was cancelled or reader is null
                }
                
                reader.read()
                    .then(({ done, value }) => {
                        if (!isStreamActive) {
                            return; // Stream was cancelled during read
                        }
                        
                        if (done) {
                            console.log('Generation stream completed');
                            cleanup();
                            return;
                        }
                        
                        try {
                            buffer += decoder.decode(value, { stream: true });
                            
                            // Guard against buffer overflow to prevent memory exhaustion
                            const MAX_BUFFER_SIZE = 1024 * 1024; // 1 MB max buffer
                            if (buffer.length > MAX_BUFFER_SIZE) {
                                console.error('SSE buffer overflow - potential malformed stream');
                                handleError(new Error('Stream buffer exceeded maximum size'), retryCount);
                                return;
                            }
                            
                            // Process complete messages (separated by \n\n)
                            const messages = buffer.split('\n\n');
                            buffer = messages.pop() || ''; // Keep incomplete message in buffer
                            
                            messages.forEach(message => {
                                if (message.trim().startsWith('data: ')) {
                                    try {
                                        const jsonData = message.slice(6).trim();
                                        if (jsonData) {
                                            const data = JSON.parse(jsonData);
                                            
                                            switch (data.type) {
                                                case 'progress':
                                                    if (onProgress && isStreamActive) {
                                                        onProgress(data);
                                                    }
                                                    break;
                                                case 'complete':
                                                    if (onComplete && isStreamActive) {
                                                        onComplete(data);
                                                    }
                                                    cleanup();
                                                    return;
                                                case 'error':
                                                    if (onError && isStreamActive) {
                                                        onError({
                                                            projectId: project.id,
                                                            error: data.error || 'Generation error',
                                                            timestamp: Date.now()
                                                        });
                                                    }
                                                    cleanup();
                                                    return;
                                                default:
                                                    console.warn('Unknown message type:', data.type);
                                            }
                                        }
                                    } catch (parseError) {
                                        console.error('Error parsing SSE message:', parseError, 'Raw message:', message);
                                        // Continue processing other messages
                                    }
                                }
                            });
                            
                            // Continue reading if stream is still active
                            if (isStreamActive) {
                                processStream();
                            }
                            
                        } catch (decodeError) {
                            console.error('Error decoding stream chunk:', decodeError);
                            handleError(decodeError, retryCount);
                        }
                    })
                    .catch(readError => {
                        if (!isStreamActive) {
                            return; // Stream was cancelled, ignore read errors
                        }
                        console.error('Stream read error:', readError);
                        handleError(readError, retryCount);
                    });
            }
            
            // Start processing the stream
            processStream();
            
        })
        .catch(fetchError => {
            if (!isStreamActive) {
                return; // Stream was cancelled, ignore fetch errors
            }
            handleError(fetchError, retryCount);
        });
    };
    
    // Start the initial generation attempt
    startGenerationInternal(0);
    
    // Return cleanup function for caller to cancel if needed
    return cleanup;
}

/**
 * Checks the status of the content generation process for a specific project.
 * This function queries the backend to determine if a generation is currently active and to get its timing information.
 *
 * @param {string} projectId - The unique identifier of the project to check.
 * @returns {Promise<Object>} A Promise that resolves to a status object, which includes an `active` flag and other status information.
 * @throws {Error} Throws an error if the status check fails.
 */
export async function checkGenerationStatus(projectId) {
    const response = await fetch(`${API_URL}/generate/${projectId}/status`);
    if (!response.ok) throw new Error('Failed to check generation status');
    return response.json();
}

/**
 * Cancels an active content generation process for a specific project.
 * This function sends a DELETE request to the backend to stop the ongoing generation and clean up server resources.
 *
 * @param {string} projectId - The unique identifier of the project for which to cancel generation.
 * @returns {Promise<Object>} A Promise that resolves to a confirmation message from the server.
 * @throws {Error} Throws an error if the cancellation fails or if no active generation is found.
 */
export async function cancelGeneration(projectId) {
    const response = await fetch(`${API_URL}/generate/${projectId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel generation');
    return response.json();
}

/**
 * A convenience function to update a project with newly generated content and its associated metadata.
 * This function updates both the `generatedContent` and `generationMetadata` fields of the project.
 *
 * @param {string} projectId - The unique identifier of the project to update.
 * @param {string} content - The generated content to be saved.
 * @param {Object} metadata - The metadata associated with the generation process.
 * @returns {Promise<Object>} A Promise that resolves to the updated project object.
 * @throws {Error} Throws an error if the update fails or if the project is not found.
 */
export async function updateProjectWithGeneratedContent(projectId, content, metadata) {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            generatedContent: content,
            generationMetadata: metadata
        }),
    });
    if (!response.ok) throw new Error('Failed to update project with generated content');
    return response.json();
}

// --- Server Status ---

/**
 * Checks the health and configuration status of the backend server.
 * This function is used for health monitoring and for troubleshooting connectivity issues.
 *
 * @returns {Promise<Object>} A Promise that resolves to a server status object.
 * @throws {Error} Throws an error if the server status check fails or if the server is unreachable.
 */
export async function checkServerStatus() {
    const response = await fetch(`${API_URL}/status`);
    if (!response.ok) throw new Error('Failed to check server status');
    return response.json();
}
