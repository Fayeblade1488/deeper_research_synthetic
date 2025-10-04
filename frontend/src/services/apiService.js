const API_URL = 'http://localhost:3001/api';

/**
 * API Service for THE LENS
 * Handles all communication with THE FORGE backend
 */

// --- Project CRUD Operations ---

/**
 * Fetch all projects from THE FORGE backend
 * 
 * Retrieves a complete list of all projects stored on the server.
 * Used to populate the project list in the sidebar.
 * 
 * @returns {Promise<Array<Object>>} Promise resolving to array of project objects
 * @throws {Error} When the fetch request fails or server returns an error
 */
export async function fetchProjects() {
    const response = await fetch(`${API_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
}

/**
 * Create a new project with specified name and framework
 * 
 * Sends a POST request to create a new project. The server will generate
 * a unique ID and initialize default values for the project.
 * 
 * @param {string} name - The project name
 * @param {string} framework - Framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)
 * @returns {Promise<Object>} Promise resolving to the created project object
 * @throws {Error} When project creation fails or validation errors occur
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
 * Update an existing project with new data
 * 
 * Sends partial or complete project updates to the server. Only the fields
 * provided in the updates object will be modified. The project ID cannot be changed.
 * 
 * @param {string} projectId - Unique identifier of the project to update
 * @param {Object} updates - Object containing the fields to update
 * @returns {Promise<Object>} Promise resolving to the updated project object
 * @throws {Error} When update fails or project is not found
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
 * Delete a project permanently
 * 
 * Removes a project from the server's memory. This action cannot be undone.
 * The project and all associated data will be lost.
 * 
 * @param {string} projectId - Unique identifier of the project to delete
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws {Error} When deletion fails or project is not found
 */
export async function deleteProject(projectId) {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
}

// --- Generation Operations ---

/**
 * Start content generation with Server-Sent Events streaming
 * @param {Object} project - Project object
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onComplete - Callback when generation completes
 * @param {Function} onError - Callback for errors
 * @returns {EventSource} EventSource instance for cancellation
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
 * Check the status of content generation for a project
 * 
 * Queries the server to determine if generation is currently active
 * for a specific project, along with timing information.
 * 
 * @param {string} projectId - Unique identifier of the project
 * @returns {Promise<Object>} Promise resolving to status object with active flag, status, timing
 * @throws {Error} When status check fails
 */
export async function checkGenerationStatus(projectId) {
    const response = await fetch(`${API_URL}/generate/${projectId}/status`);
    if (!response.ok) throw new Error('Failed to check generation status');
    return response.json();
}

/**
 * Cancel active content generation for a project
 * 
 * Sends a request to stop any ongoing generation process for the specified project.
 * This will terminate the streaming and clean up server resources.
 * 
 * @param {string} projectId - Unique identifier of the project
 * @returns {Promise<Object>} Promise resolving to cancellation confirmation
 * @throws {Error} When cancellation fails or no active generation found
 */
export async function cancelGeneration(projectId) {
    const response = await fetch(`${API_URL}/generate/${projectId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel generation');
    return response.json();
}

/**
 * Update a project with newly generated content and metadata
 * 
 * Convenience function to save generated content and its associated metadata
 * to a project. Updates both the content and generation metadata fields.
 * 
 * @param {string} projectId - Unique identifier of the project
 * @param {string} content - The generated content text
 * @param {Object} metadata - Generation metadata (word count, timing, validation, etc.)
 * @returns {Promise<Object>} Promise resolving to the updated project object
 * @throws {Error} When update fails or project is not found
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
 * Check THE FORGE server health and configuration status
 * 
 * Retrieves server operational status, project count, and API configuration status.
 * Used for health monitoring and troubleshooting connectivity issues.
 * 
 * @returns {Promise<Object>} Promise resolving to server status object
 * @throws {Error} When server status check fails or server is unreachable
 */
export async function checkServerStatus() {
    const response = await fetch(`${API_URL}/status`);
    if (!response.ok) throw new Error('Failed to check server status');
    return response.json();
}
