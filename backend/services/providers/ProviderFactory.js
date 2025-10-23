/**
 * @file ProviderFactory.js
 * @description Factory for creating AI provider instances with BYOK support
 *
 * Supports:
 * - Venice.ai (privacy-first, zero data retention, default)
 * - Google Gemini
 * - Easy extension for additional providers
 */

const VeniceProvider = require("./VeniceProvider");
const GeminiProvider = require("./GeminiProvider");

/**
 * Available AI providers
 */
const PROVIDERS = {
  VENICE: "venice",
  GEMINI: "gemini",
};

/**
 * Provider Factory
 * Creates and configures AI provider instances
 */
class ProviderFactory {
  /**
   * Create an AI provider instance
   * @param {string} providerName - Provider identifier (venice, gemini)
   * @param {Object} config - Provider configuration
   * @returns {AIProvider} Configured provider instance
   */
  static createProvider(providerName, config = {}) {
    const name = (providerName || "").toLowerCase();

    switch (name) {
      case PROVIDERS.VENICE:
        return new VeniceProvider(config);

      case PROVIDERS.GEMINI:
        return new GeminiProvider(config);

      default:
        // Default to Venice.ai for privacy
        console.warn(
          `Unknown provider "${providerName}", defaulting to Venice.ai for privacy`
        );
        return new VeniceProvider(config);
    }
  }

  /**
   * Create provider from environment variables
   * Uses PROVIDER env var to select, defaults to Venice.ai
   * @returns {AIProvider} Configured provider
   */
  static createFromEnv() {
    const providerName =
      process.env.AI_PROVIDER || process.env.PROVIDER || PROVIDERS.VENICE;
    const anonymousMode = process.env.ANONYMOUS_MODE !== "false"; // Default true

    const config = {
      // Venice.ai config
      apiKey: process.env.VENICE_API_KEY || process.env.GEMINI_API_KEY,
      anonymousMode,
      temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.MAX_OUTPUT_TOKENS) || 32000,

      // Gemini config
      topP: parseFloat(process.env.TOP_P) || 0.95,
      topK: parseInt(process.env.TOP_K) || 40,

      // Common config
      model: process.env.MODEL,
      enableWebSearch: process.env.ENABLE_WEB_SEARCH || "off",
      enableWebCitations: process.env.ENABLE_WEB_CITATIONS === "true",
    };

    const provider = ProviderFactory.createProvider(providerName, config);

    console.log(`🤖 AI Provider: ${provider.name}`);
    console.log(
      `🔒 Privacy Mode: ${
        provider.getInfo().privacyFocused ? "ENABLED" : "DISABLED"
      }`
    );
    console.log(`📊 Data Retention: ${provider.getInfo().dataRetention}`);

    if (provider.name === "Venice.ai") {
      console.log(
        `👤 Anonymous Mode: ${config.anonymousMode ? "ENABLED" : "DISABLED"}`
      );
    }

    return provider;
  }

  /**
   * Get list of available providers
   * @returns {Array<Object>} Provider information
   */
  static getAvailableProviders() {
    return [
      {
        id: PROVIDERS.VENICE,
        name: "Venice.ai",
        description: "Privacy-first AI with zero data retention",
        privacyFocused: true,
        dataRetention: "zero",
        openSource: true,
        uncensored: true,
        recommended: true,
        requiresApiKey: true,
        apiKeyEnv: "VENICE_API_KEY",
      },
      {
        id: PROVIDERS.GEMINI,
        name: "Google Gemini",
        description: "Google's advanced AI with long context support",
        privacyFocused: false,
        dataRetention: "per Google Cloud terms",
        openSource: false,
        uncensored: false,
        recommended: false,
        requiresApiKey: true,
        apiKeyEnv: "GEMINI_API_KEY",
      },
    ];
  }

  /**
   * Validate provider configuration
   * @param {string} providerName - Provider to validate
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  static validateConfig(providerName, config) {
    const errors = [];
    const warnings = [];

    try {
      const provider = ProviderFactory.createProvider(providerName, config);
      provider.validateConfig();
    } catch (error) {
      errors.push(error.message);
    }

    // Privacy warnings
    if (providerName === PROVIDERS.GEMINI) {
      warnings.push(
        "Gemini stores data per Google Cloud terms - consider Venice.ai for privacy"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get default provider (Venice.ai for privacy)
   * @returns {string} Default provider name
   */
  static getDefaultProvider() {
    return PROVIDERS.VENICE;
  }
}

// Export PROVIDERS enum and factory
module.exports = ProviderFactory;
module.exports.PROVIDERS = PROVIDERS;
