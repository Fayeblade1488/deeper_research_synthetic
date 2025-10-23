/**
 * @file AI provider base class unit tests
 * @description Unit tests for the AIProvider base class
 */

const AIProvider = require('../../../services/providers/AIProvider');

describe('AIProvider', () => {
  let provider;

  beforeEach(() => {
    // Create a mock provider that extends AIProvider
    class MockProvider extends AIProvider {
      constructor(config = {}) {
        super(config);
        this.name = 'Mock AI Provider';
        this.baseURL = 'https://api.mock.ai/v1';
        this.apiKey = config.apiKey || 'mock-api-key';
      }

      validateConfig() {
        if (!this.apiKey) {
          throw new Error('Mock AI API key is required');
        }
      }

      getInfo() {
        return {
          name: this.name,
          privacyFocused: true,
          dataRetention: 'zero',
          openSource: true,
          uncensored: true,
          apiCompatibility: ['openai'],
          features: {
            anonymousMode: true,
            webSearch: true,
            webCitations: true,
            reasoning: true,
            vision: true,
          },
        };
      }

      getSupportedFeatures() {
        return [
          'streaming',
          'chat',
          'anonymous',
          'web-search',
          'web-citations',
          'reasoning',
          'vision',
          'function-calling',
          'json-mode',
        ];
      }

      async generateWithStreaming({ prompt, onProgress, context = [] }) {
        // Mock implementation
        let fullContent = '';
        const chunks = ['Hello', ' ', 'World', '!'];
        
        for (let i = 0; i < chunks.length; i++) {
          fullContent += chunks[i];
          
          if (onProgress) {
            onProgress({
              type: 'progress',
              content: fullContent,
              chunks: i + 1,
              provider: this.name,
            });
          }
          
          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        if (onProgress) {
          onProgress({
            type: 'complete',
            content: fullContent,
            chunks: chunks.length,
            provider: this.name,
          });
        }
        
        return {
          content: fullContent,
          provider: this.name,
          anonymous: this.anonymousMode,
          dataRetention: 'zero',
          chunks: chunks.length,
        };
      }

      parseStreamChunk(chunk) {
        if (!chunk) return null;
        return {
          content: chunk.content || '',
          reasoning: chunk.reasoning || null,
          done: chunk.done || false,
        };
      }

      parseResponse(response) {
        return {
          content: response.content || '',
          reasoning: response.reasoning || null,
          model: response.model,
          usage: response.usage || {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          finishReason: response.finishReason,
          provider: this.name,
          anonymous: this.anonymousMode,
          dataRetention: 'zero',
        };
      }

      async getModels() {
        return [
          {
            id: 'mock-1.0',
            name: 'Mock AI 1.0',
            contextWindow: 32768,
            description: 'Mock AI model for testing',
          },
        ];
      }

      setAnonymousMode(enabled) {
        this.anonymousMode = enabled;
      }

      getPrivacySettings() {
        return {
          anonymousMode: this.anonymousMode,
          dataRetention: 'zero',
          includeVeniceSystemPrompt: !this.anonymousMode,
          userIdentifier: this.anonymousMode ? 'discarded' : 'sent (but discarded by Venice)',
          conversationLogging: 'never',
          contentStorage: 'never',
        };
      }
    }

    provider = new MockProvider({ apiKey: 'test-key' });
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.name).toBe('Mock AI Provider');
      expect(provider.baseURL).toBe('https://api.mock.ai/v1');
      expect(provider.apiKey).toBe('test-key');
      expect(provider.anonymousMode).toBe(true);
      expect(provider.config).toEqual({ apiKey: 'test-key' });
    });

    it('should default to anonymous mode when not specified', () => {
      const providerWithoutAnonymousMode = new AIProvider({ apiKey: 'test-key' });
      expect(providerWithoutAnonymousMode.anonymousMode).toBe(true);
    });

    it('should handle missing config gracefully', () => {
      const providerWithoutConfig = new AIProvider();
      expect(providerWithoutConfig.config).toEqual({});
    });

    it('should handle null config gracefully', () => {
      const providerWithNullConfig = new AIProvider(null);
      expect(providerWithNullConfig.config).toEqual({});
    });

    it('should handle undefined config gracefully', () => {
      const providerWithUndefinedConfig = new AIProvider(undefined);
      expect(providerWithUndefinedConfig.config).toEqual({});
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      expect(() => provider.validateConfig()).not.toThrow();
    });

    it('should throw error for missing API key', () => {
      const providerWithoutKey = new AIProvider({});
      expect(() => providerWithoutKey.validateConfig()).toThrow('Mock AI API key is required');
    });
  });

  describe('getInfo', () => {
    it('should return provider information', () => {
      const info = provider.getInfo();
      expect(info).toEqual({
        name: 'Mock AI Provider',
        privacyFocused: true,
        dataRetention: 'zero',
        openSource: true,
        uncensored: true,
        apiCompatibility: ['openai'],
        features: {
          anonymousMode: true,
          webSearch: true,
          webCitations: true,
          reasoning: true,
          vision: true,
        },
      });
    });
  });

  describe('getSupportedFeatures', () => {
    it('should return list of supported features', () => {
      const features = provider.getSupportedFeatures();
      expect(features).toEqual([
        'streaming',
        'chat',
        'anonymous',
        'web-search',
        'web-citations',
        'reasoning',
        'vision',
        'function-calling',
        'json-mode',
      ]);
    });
  });

  describe('formatRequest', () => {
    it('should format request correctly', () => {
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      const context = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];
      
      const request = provider.formatRequest(systemPrompt, userPrompt, context);
      
      expect(request).toEqual({
        model: 'mock-1.0',
        messages: [
          { role: 'system', content: 'System instructions' },
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
          { role: 'user', content: 'User message' },
        ],
        temperature: 0.7,
        max_completion_tokens: 32000,
        stream: true,
      });
    });

    it('should handle empty system prompt', () => {
      const systemPrompt = '';
      const userPrompt = 'User message';
      
      const request = provider.formatRequest(systemPrompt, userPrompt);
      
      expect(request.messages).toEqual([
        { role: 'user', content: 'User message' },
      ]);
    });

    it('should handle empty context', () => {
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      const context = [];
      
      const request = provider.formatRequest(systemPrompt, userPrompt, context);
      
      expect(request.messages).toEqual([
        { role: 'system', content: 'System instructions' },
        { role: 'user', content: 'User message' },
      ]);
    });

    it('should use custom model when provided', () => {
      provider.config.model = 'custom-model';
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.model).toBe('custom-model');
    });

    it('should use custom temperature when provided', () => {
      provider.config.temperature = 0.9;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.temperature).toBe(0.9);
    });

    it('should use custom max tokens when provided', () => {
      provider.config.maxTokens = 16000;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.max_completion_tokens).toBe(16000);
    });

    it('should exclude system prompt in anonymous mode', () => {
      provider.anonymousMode = true;
      
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      
      const request = provider.formatRequest(systemPrompt, userPrompt);
      
      expect(request.messages).toEqual([
        { role: 'user', content: 'User message' },
      ]);
    });
  });

  describe('generateWithStreaming', () => {
    it('should generate content with streaming', async () => {
      const onProgress = jest.fn();
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      });
      
      expect(result).toEqual({
        content: 'Hello World!',
        provider: 'Mock AI Provider',
        anonymous: true,
        dataRetention: 'zero',
        chunks: 4,
      });
      
      // Verify progress callbacks
      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello',
        chunks: 1,
        provider: 'Mock AI Provider',
      });
      
      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello ',
        chunks: 2,
        provider: 'Mock AI Provider',
      });
      
      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello World',
        chunks: 3,
        provider: 'Mock AI Provider',
      });
      
      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello World!',
        chunks: 4,
        provider: 'Mock AI Provider',
      });
      
      expect(onProgress).toHaveBeenCalledWith({
        type: 'complete',
        content: 'Hello World!',
        chunks: 4,
        provider: 'Mock AI Provider',
      });
    });

    it('should handle errors during generation', async () => {
      // Mock provider to throw error
      class ErrorProvider extends AIProvider {
        constructor(config = {}) {
          super(config);
          this.name = 'Error Provider';
        }
        
        async generateWithStreaming({ prompt, onProgress, context = [] }) {
          throw new Error('Generation failed');
        }
      }
      
      const errorProvider = new ErrorProvider({ apiKey: 'test-key' });
      const onProgress = jest.fn();
      
      await expect(errorProvider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      })).rejects.toThrow('Generation failed');
    });

    it('should handle progress callback errors', async () => {
      const faultyOnProgress = () => {
        throw new Error('Progress callback error');
      };
      
      await expect(provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress: faultyOnProgress,
      })).rejects.toThrow('Generation failed: Progress callback error');
    });

    it('should handle missing progress callback', async () => {
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
        // No onProgress callback
      });
      
      expect(result).toEqual({
        content: 'Hello World!',
        provider: 'Mock AI Provider',
        anonymous: true,
        dataRetention: 'zero',
        chunks: 4,
      });
    });

    it('should use default model when not specified', async () => {
      provider.config.model = undefined;
      
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
      });
      
      expect(result.provider).toBe('Mock AI Provider');
    });

    it('should handle empty prompt', async () => {
      const onProgress = jest.fn();
      const result = await provider.generateWithStreaming({
        prompt: '',
        onProgress,
      });
      
      expect(result.content).toBe('Hello World!');
    });
  });

  describe('parseStreamChunk', () => {
    it('should parse valid stream chunk', () => {
      const chunk = { content: 'Hello', reasoning: 'Thinking...', done: false };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: 'Hello',
        reasoning: 'Thinking...',
        done: false,
      });
    });

    it('should handle null chunk', () => {
      const result = provider.parseStreamChunk(null);
      expect(result).toBeNull();
    });

    it('should handle undefined chunk', () => {
      const result = provider.parseStreamChunk(undefined);
      expect(result).toBeNull();
    });

    it('should handle empty chunk', () => {
      const chunk = {};
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: '',
        reasoning: null,
        done: false,
      });
    });

    it('should handle chunk with only content', () => {
      const chunk = { content: 'Hello' };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: 'Hello',
        reasoning: null,
        done: false,
      });
    });

    it('should handle chunk with only reasoning', () => {
      const chunk = { reasoning: 'Thinking...' };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: '',
        reasoning: 'Thinking...',
        done: false,
      });
    });

    it('should handle chunk marked as done', () => {
      const chunk = { done: true };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: '',
        reasoning: null,
        done: true,
      });
    });
  });

  describe('parseResponse', () => {
    it('should parse response correctly', () => {
      const response = {
        content: 'Generated content',
        reasoning: 'Reasoning content',
        model: 'mock-1.0',
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
        finishReason: 'stop',
      };
      
      const result = provider.parseResponse(response);
      
      expect(result).toEqual({
        content: 'Generated content',
        reasoning: 'Reasoning content',
        model: 'mock-1.0',
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
        finishReason: 'stop',
        provider: 'Mock AI Provider',
        anonymous: true,
        dataRetention: 'zero',
      });
    });

    it('should handle missing fields gracefully', () => {
      const response = {};
      
      const result = provider.parseResponse(response);
      
      expect(result).toEqual({
        content: '',
        reasoning: null,
        model: undefined,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: undefined,
        provider: 'Mock AI Provider',
        anonymous: true,
        dataRetention: 'zero',
      });
    });

    it('should handle missing usage information', () => {
      const response = {
        content: 'Generated content',
      };
      
      const result = provider.parseResponse(response);
      
      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle partial usage information', () => {
      const response = {
        content: 'Generated content',
        usage: {
          promptTokens: 100,
        },
      };
      
      const result = provider.parseResponse(response);
      
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe('getModels', () => {
    it('should return list of available models', async () => {
      const models = await provider.getModels();
      
      expect(models).toEqual([
        {
          id: 'mock-1.0',
          name: 'Mock AI 1.0',
          contextWindow: 32768,
          description: 'Mock AI model for testing',
        },
      ]);
    });
  });

  describe('setAnonymousMode', () => {
    it('should set anonymous mode correctly', () => {
      provider.setAnonymousMode(false);
      expect(provider.anonymousMode).toBe(false);
      
      provider.setAnonymousMode(true);
      expect(provider.anonymousMode).toBe(true);
    });

    it('should handle invalid input', () => {
      provider.setAnonymousMode(null);
      expect(provider.anonymousMode).toBe(null);
      
      provider.setAnonymousMode(undefined);
      expect(provider.anonymousMode).toBe(undefined);
      
      provider.setAnonymousMode('');
      expect(provider.anonymousMode).toBe('');
    });
  });

  describe('getPrivacySettings', () => {
    it('should return privacy settings for anonymous mode', () => {
      provider.anonymousMode = true;
      
      const settings = provider.getPrivacySettings();
      
      expect(settings).toEqual({
        anonymousMode: true,
        dataRetention: 'zero',
        includeVeniceSystemPrompt: false,
        userIdentifier: 'discarded',
        conversationLogging: 'never',
        contentStorage: 'never',
      });
    });

    it('should return privacy settings for non-anonymous mode', () => {
      provider.anonymousMode = false;
      
      const settings = provider.getPrivacySettings();
      
      expect(settings).toEqual({
        anonymousMode: false,
        dataRetention: 'zero',
        includeVeniceSystemPrompt: true,
        userIdentifier: 'sent (but discarded by Venice)',
        conversationLogging: 'never',
        contentStorage: 'never',
      });
    });
  });
});