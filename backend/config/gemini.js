const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model configuration for long-form content generation
const modelConfig = {
    model: 'gemini-2.0-flash-exp', // Using latest model with extended context
    generationConfig: {
        temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
        topP: parseFloat(process.env.TOP_P) || 0.95,
        topK: parseInt(process.env.TOP_K) || 40,
        maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS) || 32000,
    },
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
        },
    ],
};

/**
 * Get configured Gemini model instance
 * @returns {GenerativeModel} Configured Gemini model
 */
function getModel() {
    return genAI.getGenerativeModel(modelConfig);
}

/**
 * Generate content with streaming support
 * @param {string} prompt - The full prompt including framework instructions
 * @param {Function} onChunk - Callback for each streamed chunk
 * @returns {Promise<string>} Complete generated text
 */
async function generateWithStreaming(prompt, onChunk) {
    const model = getModel();
    const result = await model.generateContentStream(prompt);
    
    let fullText = '';
    
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        
        if (onChunk) {
            onChunk(chunkText);
        }
    }
    
    return fullText;
}

/**
 * Generate content without streaming (for testing)
 * @param {string} prompt - The full prompt
 * @returns {Promise<string>} Generated text
 */
async function generateContent(prompt) {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = {
    getModel,
    generateWithStreaming,
    generateContent,
};
