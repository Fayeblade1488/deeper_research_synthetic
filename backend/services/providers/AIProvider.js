/**
 * @file AIProvider.js
 * @description Base abstract class for AI provider implementations
 *
 * This establishes the contract that all AI providers (Venice.ai, Gemini, etc.)
 * must implement. Ensures consistent interface for swapping providers.
 */

/**
 * Abstract base class for AI providers
 * All providers must extend this class and implement its methods
 */
class AIProvider {
  constructor(config = {}) {
    if (new.target === AIProvider) {
      throw new TypeError(
        "Cannot instantiate AIProvider directly - must use a concrete implementation"
      );
    }

    this.config = config;
    this.name = "AIProvider";
    this.validateConfig();
  }

  /**
   * Validate provider-specific configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfig() {
    throw new Error("validateConfig() must be implemented by provider");
  }

  /**
   * Generate content with streaming support
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - The prompt to send
   * @param {Object} params.options - Provider-specific options
   * @param {Function} params.onProgress - Callback for streaming updates
   * @returns {Promise<Object>} Generation result
   */
  async generateWithStreaming(params) {
    throw new Error("generateWithStreaming() must be implemented by provider");
  }

  /**
   * Get information about available models
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    throw new Error("getModels() must be implemented by provider");
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: this.name,
      privacyFocused: false,
      dataRetention: "unknown",
      openSource: false,
      apiCompatibility: [],
    };
  }

  /**
   * Check if provider supports a specific feature
   * @param {string} feature - Feature name
   * @returns {boolean} Whether feature is supported
   */
  supportsFeature(feature) {
    const supportedFeatures = this.getSupportedFeatures();
    return supportedFeatures.includes(feature);
  }

  /**
   * Get list of supported features
   * @returns {Array<string>} Feature names
   */
  getSupportedFeatures() {
    return [];
  }

  /**
   * Format prompt according to provider requirements
   * @param {string} systemPrompt - System prompt
   * @param {string} userPrompt - User prompt
   * @param {Array} context - Conversation context
   * @returns {Object} Formatted request
   */
  formatRequest(systemPrompt, userPrompt, context = []) {
    throw new Error("formatRequest() must be implemented by provider");
  }

  /**
   * Parse provider response to standard format
   * @param {Object} response - Provider response
   * @returns {Object} Standardized response
   */
  parseResponse(response) {
    throw new Error("parseResponse() must be implemented by provider");
  }

  /**
   * Handle streaming chunk from provider
   * @param {string} chunk - Raw chunk data
   * @returns {Object|null} Parsed chunk or null if incomplete
   */
  parseStreamChunk(chunk) {
    throw new Error("parseStreamChunk() must be implemented by provider");
  }

  /**
   * Get estimated token count for a prompt
   * @param {string} text - Text to count tokens for
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    // Default rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Default: no cleanup needed
    return Promise.resolve();
  }
}

module.exports = AIProvider;
