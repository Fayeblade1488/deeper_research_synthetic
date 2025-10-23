/**
 * @file VeniceProvider.js
 * @description Venice.ai API provider implementation with privacy-first features
 *
 * Venice.ai Features:
 * - Zero data retention - no conversations or content stored
 * - OpenAI API compatible
 * - Uncensored responses
 * - Open-source models only
 * - Anonymous mode support (no user identifiers)
 *
 * @see https://api.venice.ai/api/v1
 * @see Venice.ai API Documentation
 */

const AIProvider = require("./AIProvider");

class VeniceProvider extends AIProvider {
  constructor(config = {}) {
    // Set apiKey BEFORE super() call so validateConfig() can access it
    config.apiKey = config.apiKey || process.env.VENICE_API_KEY;
    super(config);
    this.name = "Venice.ai";
    this.baseURL = "https://api.venice.ai/api/v1";
    this.apiKey = config.apiKey;
    this.anonymousMode = config.anonymousMode !== false; // Default to true
  }

  /**
   * Validate Venice.ai configuration
   * @throws {Error} If API key is missing
   */
  validateConfig() {
    // Check config.apiKey since this is called before this.apiKey is set
    if (!this.config.apiKey) {
      throw new Error(
        "Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config."
      );
    }
  }

  /**
   * Get Venice.ai provider information
   * @returns {Object} Provider metadata
   */
  getInfo() {
    return {
      name: "Venice.ai",
      privacyFocused: true,
      dataRetention: "zero - no data stored",
      openSource: true,
      uncensored: true,
      apiCompatibility: ["openai"],
      features: {
        anonymousMode: true,
        webSearch: true,
        webCitations: true,
        reasoning: true,
        vision: true,
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
      "anonymous",
      "web-search",
      "web-citations",
      "reasoning",
      "vision",
      "function-calling",
      "json-mode",
    ];
  }

  /**
   * Format request for Venice.ai API
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message
   * @param {Array} context - Previous messages
   * @returns {Object} Venice.ai formatted request
   */
  formatRequest(systemPrompt, userPrompt, context = []) {
    const messages = [];

    // Add system prompt unless anonymous mode with no Venice prompts
    if (
      systemPrompt &&
      !(this.anonymousMode && !this.config.includeVeniceSystemPrompt)
    ) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Add conversation context
    if (context && context.length > 0) {
      messages.push(...context);
    }

    // Add user message
    messages.push({
      role: "user",
      content: userPrompt,
    });

    return {
      model: this.config.model || "llama-3.3-70b",
      messages,
      temperature: this.config.temperature ?? 0.7,
      max_completion_tokens: this.config.maxTokens || 32000,
      stream: true,
      venice_parameters: {
        // Anonymous mode: disable Venice system prompts
        include_venice_system_prompt: this.anonymousMode ? false : true,
        // Privacy: disable web search unless explicitly enabled
        enable_web_search: this.config.enableWebSearch || "off",
        enable_web_citations: this.config.enableWebCitations || false,
        // No user identifier in anonymous mode (discarded anyway)
        ...(this.anonymousMode ? {} : { user: this.config.userId }),
      },
    };
  }

  /**
   * Generate content with streaming
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateWithStreaming({ prompt, onProgress, context = [] }) {
    const requestBody = this.formatRequest(
      this.config.systemPrompt || "",
      prompt,
      context
    );

    let fullContent = "";
    let chunks = 0;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Venice.ai API error: ${response.status} - ${error}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                fullContent += content;
                chunks++;

                // Send progress updates every 10 chunks
                if (chunks % 10 === 0 && onProgress) {
                  onProgress({
                    type: "progress",
                    content: fullContent,
                    chunks,
                    provider: "venice",
                  });
                }
              }
            } catch (e) {
              console.warn("Failed to parse Venice.ai chunk:", e.message);
            }
          }
        }
      }

      return {
        content: fullContent,
        provider: "venice",
        anonymous: this.anonymousMode,
        dataRetention: "zero",
        chunks,
      };
    } catch (error) {
      console.error("Venice.ai generation error:", error);
      throw new Error(`Venice.ai generation failed: ${error.message}`);
    }
  }

  /**
   * Parse Venice.ai streaming chunk
   * @param {string} chunk - SSE chunk
   * @returns {Object|null} Parsed content or null
   */
  parseStreamChunk(chunk) {
    if (!chunk.startsWith("data: ")) return null;

    const data = chunk.slice(6);
    if (data === "[DONE]") return { done: true };

    try {
      const parsed = JSON.parse(data);
      return {
        content: parsed.choices?.[0]?.delta?.content || "",
        reasoning: parsed.choices?.[0]?.delta?.reasoning_content || null,
        done: false,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse Venice.ai response to standard format
   * @param {Object} response - Venice.ai response
   * @returns {Object} Standardized response
   */
  parseResponse(response) {
    return {
      content: response.choices?.[0]?.message?.content || "",
      reasoning: response.choices?.[0]?.message?.reasoning_content || null,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices?.[0]?.finish_reason,
      provider: "venice",
      anonymous: this.anonymousMode,
      dataRetention: "zero",
    };
  }

  /**
   * Get available Venice.ai models
   * @returns {Promise<Array>} Model list
   */
  async getModels() {
    // Venice.ai popular models (as of knowledge cutoff)
    return [
      {
        id: "llama-3.3-70b",
        name: "Llama 3.3 70B",
        contextWindow: 128000,
        description: "Meta's latest Llama model, excellent for complex tasks",
      },
      {
        id: "qwen-2.5-72b",
        name: "Qwen 2.5 72B",
        contextWindow: 32768,
        description: "Alibaba's powerful multilingual model",
      },
      {
        id: "dolphin-2.9.2-qwen2-72b",
        name: "Dolphin 2.9.2 Qwen2 72B",
        contextWindow: 32768,
        description: "Uncensored fine-tune of Qwen2",
      },
      {
        id: "deepseek-r1",
        name: "DeepSeek R1",
        contextWindow: 64000,
        description: "Reasoning model with chain-of-thought capabilities",
      },
    ];
  }

  /**
   * Set anonymous mode
   * @param {boolean} enabled - Enable/disable anonymous mode
   */
  setAnonymousMode(enabled) {
    this.anonymousMode = enabled;
    console.log(
      `Venice.ai anonymous mode: ${enabled ? "ENABLED" : "DISABLED"}`
    );
  }

  /**
   * Get current privacy settings
   * @returns {Object} Privacy configuration
   */
  getPrivacySettings() {
    return {
      anonymousMode: this.anonymousMode,
      dataRetention: "zero",
      includeVeniceSystemPrompt: !this.anonymousMode,
      userIdentifier: this.anonymousMode
        ? "discarded"
        : "sent (but discarded by Venice)",
      conversationLogging: "never",
      contentStorage: "never",
    };
  }
}

module.exports = VeniceProvider;
