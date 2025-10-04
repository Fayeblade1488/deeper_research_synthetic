const { generateWithStreaming } = require('../config/gemini');
const { constructPrompt, getFrameworkMetadata } = require('./frameworkService');
const { validateOutput } = require('./validationService');

/**
 * Generate content for a project
 * @param {Object} project - The project object
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Generation result with content and metadata
 */
async function generateContent(project, onProgress) {
    const { framework, sourceContext, name } = project;
    
    // Validate inputs
    if (!sourceContext || sourceContext.trim().length === 0) {
        throw new Error('Source context is required for generation');
    }
    
    // Get framework metadata
    const frameworkMeta = getFrameworkMetadata(framework);
    if (!frameworkMeta) {
        throw new Error(`Invalid framework: ${framework}`);
    }
    
    // Construct full prompt
    const prompt = await constructPrompt(framework, sourceContext);
    
    // Track generation progress
    let generatedText = '';
    let wordCount = 0;
    let chunkCount = 0;
    
    const startTime = Date.now();
    
    // Generate with streaming
    try {
        generatedText = await generateWithStreaming(prompt, (chunk) => {
            chunkCount++;
            generatedText += chunk;
            wordCount = countWords(generatedText);
            
            // Send progress update every 10 chunks
            if (chunkCount % 10 === 0 && onProgress) {
                onProgress({
                    type: 'progress',
                    wordCount,
                    chunkCount,
                    estimatedProgress: Math.min((wordCount / frameworkMeta.minWords) * 100, 95),
                });
            }
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        
        // Final word count
        wordCount = countWords(generatedText);
        
        // Validate output
        const validation = validateOutput(generatedText, framework);
        
        // Send completion update
        if (onProgress) {
            onProgress({
                type: 'complete',
                wordCount,
                duration,
                validation,
            });
        }
        
        return {
            content: generatedText,
            metadata: {
                framework: frameworkMeta.name,
                outputType: frameworkMeta.outputType,
                wordCount,
                generationTime: duration,
                timestamp: new Date().toISOString(),
                validation,
            },
        };
        
    } catch (error) {
        console.error('Generation error:', error);
        
        if (onProgress) {
            onProgress({
                type: 'error',
                error: error.message,
            });
        }
        
        throw new Error(`Generation failed: ${error.message}`);
    }
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate time remaining for generation with robust edge case handling
 * @param {number} currentWords - Current word count
 * @param {number} targetWords - Target word count
 * @param {number} elapsedSeconds - Time elapsed so far
 * @returns {number} Estimated seconds remaining
 */
function estimateTimeRemaining(currentWords, targetWords, elapsedSeconds) {
    // Input validation
    if (typeof currentWords !== 'number' || 
        typeof targetWords !== 'number' || 
        typeof elapsedSeconds !== 'number') {
        console.warn('Invalid input types for time estimation');
        return 0;
    }
    
    // Handle negative or invalid values
    currentWords = Math.max(0, currentWords);
    targetWords = Math.max(0, targetWords);
    elapsedSeconds = Math.max(0, elapsedSeconds);
    
    // If we've already reached or exceeded the target, no time remaining
    if (currentWords >= targetWords) {
        return 0;
    }
    
    // If no progress has been made yet, return a reasonable default estimate
    if (currentWords === 0) {
        // Fallback: assume 1 word per second as baseline
        return Math.ceil(targetWords);
    }
    
    // If no time has elapsed, can't make a meaningful estimate
    if (elapsedSeconds === 0) {
        // Very early in generation - return optimistic estimate
        return Math.ceil(targetWords / 2); // Assume we're halfway through time-wise
    }
    
    // Calculate words per second rate
    const wordsPerSecond = currentWords / elapsedSeconds;
    
    // If rate is too slow (less than 0.01 words/second), cap the estimate
    if (wordsPerSecond < 0.01) {
        // Assume minimum viable rate to avoid extremely long estimates
        const minWordsPerSecond = 0.1;
        const remainingWords = targetWords - currentWords;
        return Math.ceil(remainingWords / minWordsPerSecond);
    }
    
    // Standard calculation with safety checks
    const remainingWords = Math.max(0, targetWords - currentWords);
    const estimatedSecondsRemaining = remainingWords / wordsPerSecond;
    
    // Cap extremely long estimates (max 2 hours)
    const maxEstimateSeconds = 2 * 60 * 60;
    
    return Math.ceil(Math.min(estimatedSecondsRemaining, maxEstimateSeconds));
}

module.exports = {
    generateContent,
    countWords,
    estimateTimeRemaining,
};
