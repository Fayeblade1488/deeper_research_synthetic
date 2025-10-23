/**
 * @file GeminiProvider.js
 * @description Google Gemini API provider implementation
 *
 * @see https://ai.google.dev/docs
 */

const AIProvider = require("./AIProvider");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    // Set apiKey BEFORE super() call so validateConfig() can access it
    config.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    super(config);
    this.name = "Google Gemini";
    this.apiKey = config.apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = config.model || "gemini-2.0-flash-exp";
  }

  /**
   * Validate Gemini configuration
   * @throws {Error} If API key is missing
   */
  validateConfig() {
    // Check config.apiKey since this is called before this.apiKey is set
    if (!this.config.apiKey) {
      throw new Error(
        "Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config."
      );
    }
  }

  /**
   * Get Gemini provider information
   * @returns {Object} Provider metadata
   */
  getInfo() {
    return {
      name: "Google Gemini",
      privacyFocused: false,
      dataRetention: "per Google Cloud terms",
      openSource: false,
      apiCompatibility: ["gemini"],
      features: {
        streaming: true,
        longContext: true,
        multimodal: true,
        codeExecution: true,
      },
    };
  }

  /**
   * Get supported features
   * @returns {Array<string>} Feature list
   */
  getSupportedFeatures() {
    return [
      "streaming",
      "chat",
      "multimodal",
      "code-execution",
      "long-context",
      "function-calling",
      "json-mode",
    ];
  }

  /**
   * Get Gemini model configuration
   * @returns {Object} Model config
   */
  getModelConfig() {
    return {
      model: this.model,
      generationConfig: {
        temperature: this.config.temperature ?? 0.7,
        topP: this.config.topP ?? 0.95,
        topK: this.config.topK ?? 40,
        maxOutputTokens: this.config.maxTokens || 32000,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };
  }

  /**
   * Format request for Gemini API
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message
   * @param {Array} context - Previous messages (not used for Gemini single prompt)
   * @returns {string} Formatted prompt
   */
  formatRequest(systemPrompt, userPrompt, context = []) {
    // Gemini uses a single concatenated prompt
    let fullPrompt = "";

    if (systemPrompt) {
      fullPrompt += systemPrompt + "\n\n";
    }

    if (context && context.length > 0) {
      // Add context as conversation history
      for (const msg of context) {
        fullPrompt += `${msg.role}: ${msg.content}\n\n`;
      }
    }

    fullPrompt += userPrompt;

    return fullPrompt;
  }

  /**
   * Generate content with streaming
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateWithStreaming({ prompt, onProgress, context = [] }) {
    const formattedPrompt = this.formatRequest(
      this.config.systemPrompt || "",
      prompt,
      context
    );

    const modelConfig = this.getModelConfig();
    const model = this.genAI.getGenerativeModel(modelConfig);

    let fullText = "";
    let chunks = 0;

    try {
      const result = await model.generateContentStream(formattedPrompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        chunks++;

        // Send progress updates every 10 chunks
        if (chunks % 10 === 0 && onProgress) {
          onProgress({
            type: "progress",
            content: fullText,
            chunks,
            provider: "gemini",
          });
        }
      }

      return {
        content: fullText,
        provider: "gemini",
        model: this.model,
        chunks,
      };
    } catch (error) {
      console.error("Gemini generation error:", error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  /**
   * Parse Gemini response to standard format
   * @param {Object} response - Gemini response
   * @returns {Object} Standardized response
   */
  parseResponse(response) {
    return {
      content: response.text?.() || response.content || "",
      model: this.model,
      provider: "gemini",
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * Parse Gemini streaming chunk
   * @param {Object} chunk - Gemini chunk object
   * @returns {Object} Parsed content
   */
  parseStreamChunk(chunk) {
    return {
      content: chunk.text?.() || "",
      done: false,
    };
  }

  /**
   * Get available Gemini models
   * @returns {Promise<Array>} Model list
   */
  async getModels() {
    return [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash (Experimental)",
        contextWindow: 32000,
        description: "Latest experimental model with extended context",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        contextWindow: 128000,
        description: "Production model with very long context support",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        contextWindow: 32000,
        description: "Fast, efficient model for most tasks",
      },
    ];
  }
}

module.exports = GeminiProvider;
