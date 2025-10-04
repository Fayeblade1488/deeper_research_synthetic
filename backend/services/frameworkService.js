const fs = require('fs').promises;
const path = require('path');

const FRAMEWORKS_PATH = path.join(__dirname, '../../data/frameworks');

/**
 * Framework type mappings
 */
const FRAMEWORK_TYPES = {
    PROJECT_DEEPDIVE: {
        name: 'PROJECT_DEEPDIVE',
        outputType: 'TOME',
        promptFile: 'research_frameworks/deeper_research_framework.txt',
        minWords: 10000,
        description: 'Exhaustive academic-style white paper',
    },
    PROJECT_SYNTHETIC: {
        name: 'PROJECT_SYNTHETIC',
        outputType: 'TRANSMISSION',
        promptFile: 'podcast_synthetics/podcast-synthetic-template.md',
        minWords: 15000,
        description: 'Narrative-driven podcast episode script',
    },
    PROJECT_BENCHMARK: {
        name: 'PROJECT_BENCHMARK',
        outputType: 'SNAPSHOT',
        promptFile: 'benchmarks/human-condition-benchmark-framework.txt',
        minWords: 5000,
        description: 'Data-driven crisis dashboard with DEFCON assessment',
    },
};

/**
 * Loads the prompt content for a specified framework from a file.
 * This function includes several security checks to prevent path traversal and other file-based vulnerabilities.
 * It validates the framework type, ensures the file path is within the allowed directory, and checks that the file is a valid, non-empty file.
 *
 * @param {string} frameworkType - The type of the framework to load (e.g., PROJECT_DEEPDIVE).
 * This must be a key in the `FRAMEWORK_TYPES` object.
 *
 * @returns {Promise<string>} A Promise that resolves to the content of the framework's prompt file.
 *
 * @throws {Error} Throws an error if the framework type is invalid, the prompt file cannot be found, or a security violation is detected.
 */
async function loadFrameworkPrompt(frameworkType) {
    // Strict input validation
    if (!frameworkType || typeof frameworkType !== 'string') {
        throw new Error('Invalid framework type: must be a non-empty string');
    }
    
    // Validate against allowed framework types only
    const framework = FRAMEWORK_TYPES[frameworkType];
    if (!framework) {
        throw new Error(`Unknown framework type: ${frameworkType}`);
    }
    
    // Validate prompt file path for security
    if (!framework.promptFile || typeof framework.promptFile !== 'string') {
        throw new Error(`Invalid prompt file configuration for framework: ${frameworkType}`);
    }
    
    // Security: Check for path traversal attempts
    if (framework.promptFile.includes('..') || 
        framework.promptFile.includes('\0') || 
        path.isAbsolute(framework.promptFile)) {
        throw new Error(`Invalid prompt file path detected: potential security violation`);
    }
    
    // Construct and normalize the path
    const promptPath = path.resolve(path.join(FRAMEWORKS_PATH, framework.promptFile));
    
    // Security: Ensure the resolved path is still within the frameworks directory
    const normalizedFrameworksPath = path.resolve(FRAMEWORKS_PATH);
    if (!promptPath.startsWith(normalizedFrameworksPath + path.sep) && 
        promptPath !== normalizedFrameworksPath) {
        throw new Error(`Access denied: file path outside of frameworks directory`);
    }
    
    try {
        // Additional security check: ensure file exists and is readable
        const stat = await fs.stat(promptPath);
        if (!stat.isFile()) {
            throw new Error('Prompt path does not point to a valid file');
        }
        
        const promptContent = await fs.readFile(promptPath, 'utf-8');
        
        // Basic content validation
        if (!promptContent || promptContent.length < 10) {
            throw new Error('Prompt file appears to be empty or too short');
        }
        
        return promptContent;
    } catch (error) {
        console.error(`Error loading framework prompt from ${promptPath}:`, error.message);
        throw new Error(`Failed to load framework prompt: ${error.message}`);
    }
}

/**
 * Constructs the full prompt to be sent to the Gemini API for content generation.
 * This function combines the framework-specific prompt with the user-provided source context and an optional user query.
 * If no user query is provided, a default query is generated based on the framework's description.
 *
 * @param {string} frameworkType - The type of the framework to use for the prompt.
 * @param {string} sourceContext - The user-provided source material or context for the generation.
 * @param {string} [userQuery=''] - An optional, additional query or instruction from the user.
 *
 * @returns {Promise<string>} A Promise that resolves to the complete, formatted prompt string.
 */
async function constructPrompt(frameworkType, sourceContext, userQuery = '') {
    const frameworkPrompt = await loadFrameworkPrompt(frameworkType);
    const framework = FRAMEWORK_TYPES[frameworkType];
    
    let fullPrompt = frameworkPrompt;
    
    // Add source context section
    if (sourceContext && sourceContext.trim()) {
        fullPrompt += '\n\n--- SOURCE CONTEXT ---\n\n';
        fullPrompt += sourceContext;
        fullPrompt += '\n\n--- END SOURCE CONTEXT ---\n\n';
    }
    
    // Add user query/instructions
    if (userQuery && userQuery.trim()) {
        fullPrompt += '\n\n--- USER QUERY ---\n\n';
        fullPrompt += userQuery;
        fullPrompt += '\n\n--- END USER QUERY ---\n\n';
    } else {
        // Default query based on framework type
        fullPrompt += '\n\n--- USER QUERY ---\n\n';
        fullPrompt += `Generate a comprehensive ${framework.description} based on the provided source context. `;
        fullPrompt += `Follow all formatting and structural requirements specified in the framework instructions.`;
        fullPrompt += '\n\n--- END USER QUERY ---\n\n';
    }
    
    return fullPrompt;
}

/**
 * Retrieves the metadata for a specific framework type.
 * 
 * @param {string} frameworkType - The type of the framework for which to retrieve metadata.
 * @returns {Object | null} An object containing the framework's metadata (name, outputType, promptFile, minWords, description), or `null` if the framework type is invalid.
 */
function getFrameworkMetadata(frameworkType) {
    return FRAMEWORK_TYPES[frameworkType] || null;
}

/**
 * Validates whether a given framework type is a valid, known framework.
 * 
 * @param {string} frameworkType - The framework type to validate.
 * @returns {boolean} Returns `true` if the framework type is valid, otherwise `false`.
 */
function isValidFramework(frameworkType) {
    return frameworkType in FRAMEWORK_TYPES;
}

module.exports = {
    FRAMEWORK_TYPES,
    loadFrameworkPrompt,
    constructPrompt,
    getFrameworkMetadata,
    isValidFramework,
};
