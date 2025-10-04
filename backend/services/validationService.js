const { getFrameworkMetadata } = require('./frameworkService');

/**
 * Safely executes a regular expression match with a timeout to prevent Regular Expression Denial of Service (ReDoS) attacks.
 * If the regex execution exceeds the specified timeout, it rejects the Promise with a timeout error.
 *
 * @param {string} text - The text to match the regular expression against.
 * @param {RegExp} pattern - The regular expression pattern to use for matching.
 * @param {number} [timeoutMs=1000] - The maximum time in milliseconds to allow for the regex execution.
 *
 * @returns {Promise<RegExpMatchArray|null>} A Promise that resolves to the result of the match, or `null` if no match is found.
 * Rejects the Promise if the regex times out or if an error occurs during execution.
 */
function safeMatch(text, pattern, timeoutMs = 1000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Regex timeout - potential ReDoS attack'));
        }, timeoutMs);
        
        try {
            const result = text.match(pattern);
            clearTimeout(timeout);
            resolve(result);
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

/**
 * Validates the generated content against the requirements of the specified framework.
 * This function checks for word count, and then delegates to framework-specific validation functions.
 *
 * @param {string} content - The generated content to be validated.
 * @param {string} frameworkType - The type of the framework to validate against.
 *
 * @returns {Promise<Object>} A Promise that resolves to a validation result object.
 * The object contains a `valid` boolean, and arrays of `errors` and `warnings`.
 */
async function validateOutput(content, frameworkType) {
    const framework = getFrameworkMetadata(frameworkType);
    
    if (!framework) {
        return {
            valid: false,
            errors: ['Invalid framework type'],
            warnings: [],
        };
    }
    
    const errors = [];
    const warnings = [];
    
    // Word count validation
    const wordCount = countWords(content);
    if (wordCount < framework.minWords) {
        errors.push(`Word count ${wordCount} is below minimum ${framework.minWords}`);
    } else if (wordCount < framework.minWords * 1.2) {
        warnings.push(`Word count ${wordCount} is close to minimum ${framework.minWords}`);
    }
    
    // Framework-specific validation (now async)
    try {
        switch (frameworkType) {
            case 'PROJECT_DEEPDIVE':
                await validateDeepdive(content, errors, warnings);
                break;
            case 'PROJECT_SYNTHETIC':
                validateSynthetic(content, errors, warnings);
                break;
            case 'PROJECT_BENCHMARK':
                validateBenchmark(content, errors, warnings);
                break;
        }
    } catch (error) {
        errors.push(`Validation failed: ${error.message}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        wordCount,
    };
}

/**
 * Validates the content of a PROJECT_DEEPDIVE (TOME) output.
 * This function checks for the presence of a title, main sections, subsections, and citations.
 * It uses the `safeMatch` function to prevent ReDoS attacks on the regex patterns.
 *
 * @param {string} content - The generated content to validate.
 * @param {Array<string>} errors - An array to which any validation errors will be added.
 * @param {Array<string>} warnings - An array to which any validation warnings will be added.
 * @returns {Promise<void>} A Promise that resolves when the validation is complete.
 */
async function validateDeepdive(content, errors, warnings) {
    try {
        // Check for title (# header) with timeout protection
        const titleMatch = await safeMatch(content, /^#\s+.+$/m);
        if (!titleMatch) {
            errors.push('Missing title (# header)');
        }
        
        // Check for main sections (## headers)
        const mainSections = await safeMatch(content, /^##\s+.+$/gm);
        if (!mainSections || mainSections.length < 5) {
            errors.push(`Found ${mainSections?.length || 0} main sections, need at least 5`);
        }
        
        // Check for subsections (### headers)
        const subsections = await safeMatch(content, /^###\s+.+$/gm);
        if (!subsections || subsections.length < 10) {
            warnings.push(`Found ${subsections?.length || 0} subsections, consider adding more detail`);
        }
        
        // Check for bullet points (should not exist) - use bounded quantifier
        const bulletMatch = await safeMatch(content, /^\s{0,20}[-*+]\s+/m);
        if (bulletMatch) {
            warnings.push('Found bullet points - framework prefers flowing paragraphs');
        }
        
        // Check for citations with improved pattern that avoids false positives
        // Pattern ensures [number] is followed by space, punctuation, or end of text
        // This prevents matching code patterns like "array; [1, 2, 3]"
        const citationMatch = await safeMatch(content, /[.!?]\s*\[\d+\](?=\s|[.!?]|$)/);
        if (!citationMatch) {
            warnings.push('No proper citations found - ensure sources are cited at sentence ends');
        }
        
    } catch (error) {
        if (error.message.includes('timeout')) {
            warnings.push('Validation timeout - content may contain patterns causing excessive processing time');
        } else {
            warnings.push(`Validation error: ${error.message}`);
        }
    }
}

/**
 * Validates the content of a PROJECT_SYNTHETIC (TRANSMISSION) output.
 * This function checks for the presence of standard openers, closers, and "Key Implication" sections.
 *
 * @param {string} content - The generated content to validate.
 * @param {Array<string>} errors - An array to which any validation errors will be added.
 * @param {Array<string>} warnings - An array to which any validation warnings will be added.
 */
function validateSynthetic(content, errors, warnings) {
    // Check for opener
    if (!content.includes('Good morning')) {
        warnings.push('Missing standard opener format');
    }
    
    // Check for closer
    if (!content.includes('data infusion complete')) {
        warnings.push('Missing standard closer phrase');
    }
    
    // Check for Key Implication sections
    const implications = content.match(/\*\*Key Implication:\*\*/g);
    if (!implications || implications.length < 3) {
        warnings.push(`Found ${implications?.length || 0} Key Implication sections, need at least 3`);
    }
}

/**
 * Validates the content of a PROJECT_BENCHMARK (SNAPSHOT) output.
 * This function checks for the presence of a DEFCON assessment, data tables, score columns, and proper citations.
 *
 * @param {string} content - The generated content to validate.
 * @param {Array<string>} errors - An array to which any validation errors will be added.
 * @param {Array<string>} warnings - An array to which any validation warnings will be added.
 */
function validateBenchmark(content, errors, warnings) {
    // Check for DEFCON assessment
    if (!content.includes('DEFCON')) {
        errors.push('Missing DEFCON crisis assessment');
    }
    
    // Check for tables
    const tables = content.match(/\|.+\|/g);
    if (!tables || tables.length < 10) {
        errors.push('Missing required data tables');
    }
    
    // Check for score columns
    if (!content.includes('Score')) {
        warnings.push('Missing score column in tables');
    }
    
    // Check for proper citations (at sentence ends, not in JSON/code)
    // Improved pattern avoids matching code patterns like "method(); [10]"
    if (!content.match(/[.!?]\s*\[\d+\](?=\s|[.!?]|$)/)) {
        warnings.push('No proper citations found - ensure sources are cited at sentence ends');
    }
}

/**
 * Counts the number of actual content words in a given text, excluding Markdown syntax, code blocks, and URLs.
 * This function is designed to provide a more accurate word count for validation purposes, preventing inflated counts from Markdown formatting.
 *
 * @param {string} text - The text in which to count the words.
 * @returns {number} The total number of content words in the text.
 */
function countWords(text) {
    // Remove markdown code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove markdown headers syntax but keep the content
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove URLs (they shouldn't count as content words)
    text = text.replace(/https?:\/\/\S+/g, '');
    
    // Remove markdown formatting characters
    text = text.replace(/[*_~`]/g, '');
    
    // Remove standalone punctuation-only strings
    text = text.replace(/\b[^\w\s]+\b/g, '');
    
    // Remove table formatting
    text = text.replace(/\|/g, ' ');
    
    // Count remaining words
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

module.exports = {
    validateOutput,
};
