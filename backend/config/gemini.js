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
 * Returns a configured instance of the Google Generative AI model.
 * The model is configured with the settings defined in the `modelConfig` object.
 *
 * @returns {GenerativeModel} A configured instance of the Gemini model.
 */
function getModel() {
    return genAI.getGenerativeModel(modelConfig);
}

/**
 * Generates content from the Gemini API with streaming support.
 * This function is ideal for long-form content generation, as it allows for real-time progress updates.
 *
 * @param {string} prompt - The full prompt, including any framework instructions and source context.
 * @param {Function} onChunk - A callback function that is invoked for each streamed chunk of text.
 * The function is called with the chunk of text as its only argument.
 *
 * @returns {Promise<string>} A Promise that resolves to the complete generated text.
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
 * Generates content from the Gemini API without streaming.
 * This function is suitable for shorter content generation tasks or for testing purposes.
 *
 * @param {string} prompt - The full prompt, including any framework instructions and source context.
 * @returns {Promise<string>} A Promise that resolves to the complete generated text.
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
