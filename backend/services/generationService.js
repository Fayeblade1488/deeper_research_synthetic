const { generateWithStreaming } = require('../config/gemini');
const { constructPrompt, getFrameworkMetadata } = require('./frameworkService');
const { validateOutput } = require('./validationService');

/**
 * Generates content for a given project by constructing a prompt, streaming the output from the Gemini API, and validating the result.
 * This function orchestrates the entire content generation process, from input validation to final output.
 *
 * @param {Object} project - The project object containing all necessary data for generation.
 * @param {string} project.framework - The framework type for the generation (e.g., PROJECT_DEEPDIVE).
 * @param {string} project.sourceContext - The source text or context to be used as input for the generation.
 * @param {string} project.name - The name of the project.
 * @param {Function} onProgress - A callback function that is invoked with progress updates during the generation process.
 * The updates are sent as objects with a `type` property (e.g., 'progress', 'complete', 'error').
 *
 * @returns {Promise<Object>} A Promise that resolves to an object containing the generated content and its metadata.
 * The resolved object includes the generated text, framework information, word count, generation time, and validation results.
 *
 * @throws {Error} Throws an error if the source context is missing, the framework is invalid, or the generation process fails.
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
 * Counts the number of words in a given string of text.
 * Words are separated by one or more whitespace characters.
 * 
 * @param {string} text - The text in which to count the words.
 * @returns {number} The total number of words in the text.
 */
function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimates the remaining time for a content generation task based on the current progress.
 * This function includes robust handling for edge cases, such as invalid inputs, no progress, and very slow generation rates.
 * 
 * @param {number} currentWords - The number of words that have been generated so far.
 * @param {number} targetWords - The target number of words for the generation.
 * @param {number} elapsedSeconds - The total time in seconds that has elapsed since the generation started.
 * 
 * @returns {number} The estimated time remaining in seconds. Returns 0 if the generation is complete or if the inputs are invalid.
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
