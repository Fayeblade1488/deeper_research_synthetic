/**
 * @file Venice provider unit tests
 * @description Unit tests for the VeniceProvider class
 */

const VeniceProvider = require('../../../services/providers/VeniceProvider');

// Mock fetch globally
global.fetch = jest.fn();

describe('VeniceProvider', () => {
  let provider;
  let mockConfig;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up mock config
    mockConfig = {
      apiKey: 'test-api-key',
      anonymousMode: true,
      temperature: 0.7,
      maxTokens: 32000,
      model: 'llama-3.3-70b',
    };
    
    // Create new provider instance
    provider = new VeniceProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.name).toBe('Venice.ai');
      expect(provider.baseURL).toBe('https://api.venice.ai/api/v1');
      expect(provider.apiKey).toBe('test-api-key');
      expect(provider.anonymousMode).toBe(true);
    });

    it('should use environment variables when config not provided', () => {
      // Mock environment variables
      process.env.VENICE_API_KEY = 'env-api-key';
      process.env.ANONYMOUS_MODE = 'false';
      
      const providerWithEnv = new VeniceProvider({});
      
      expect(providerWithEnv.apiKey).toBe('env-api-key');
      expect(providerWithEnv.anonymousMode).toBe(false);
    });

    it('should default to anonymous mode when not specified', () => {
      const providerWithoutAnonymousMode = new VeniceProvider({
        apiKey: 'test-key',
      });
      
      expect(providerWithoutAnonymousMode.anonymousMode).toBe(true);
    });

    it('should handle missing API key gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const providerWithoutKey = new VeniceProvider({});
      
      expect(providerWithoutKey.apiKey).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Venice.ai API key not provided - generation will likely fail'
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      expect(() => provider.validateConfig()).not.toThrow();
    });

    it('should throw error for missing API key', () => {
      const providerWithoutKey = new VeniceProvider({});
      
      expect(() => providerWithoutKey.validateConfig()).toThrow(
        'Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config.'
      );
    });
  });

  describe('getInfo', () => {
    it('should return correct provider information', () => {
      const info = provider.getInfo();
      
      expect(info).toEqual({
        name: 'Venice.ai',
        privacyFocused: true,
        dataRetention: 'zero - no data stored',
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
    it('should format request correctly for anonymous mode', () => {
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      const context = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];
      
      const request = provider.formatRequest(systemPrompt, userPrompt, context);
      
      expect(request).toEqual({
        model: 'llama-3.3-70b',
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
          { role: 'user', content: 'User message' }, // No system message in anonymous mode
        ],
        temperature: 0.7,
        max_completion_tokens: 32000,
        stream: true,
        venice_parameters: {
          include_venice_system_prompt: false,
          enable_web_search: 'off',
          enable_web_citations: false,
        },
      });
    });

    it('should include system prompt when not in anonymous mode', () => {
      provider.anonymousMode = false;
      
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      
      const request = provider.formatRequest(systemPrompt, userPrompt);
      
      expect(request.messages).toEqual([
        { role: 'system', content: 'System instructions' },
        { role: 'user', content: 'User message' },
      ]);
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

    it('should enable web search when configured', () => {
      provider.config.enableWebSearch = 'on';
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.venice_parameters.enable_web_search).toBe('on');
    });

    it('should enable web citations when configured', () => {
      provider.config.enableWebCitations = true;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.venice_parameters.enable_web_citations).toBe(true);
    });
  });

  describe('generateWithStreaming', () => {
    it('should generate content with streaming', async () => {
      // Mock fetch response
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      
      global.fetch.mockResolvedValue({
        ok: true,
        body: mockStream,
      });
      
      const onProgress = jest.fn();
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      });
      
      expect(result).toEqual({
        content: 'Hello World',
        provider: 'venice',
        anonymous: true,
        dataRetention: 'zero',
        chunks: 2,
      });
      
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.venice.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      });
      
      await expect(provider.generateWithStreaming({
        prompt: 'Test prompt',
      })).rejects.toThrow('Venice.ai API error: 401 - Unauthorized');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(provider.generateWithStreaming({
        prompt: 'Test prompt',
      })).rejects.toThrow('Venice.ai generation failed: Network error');
    });

    it('should handle invalid JSON in stream', async () => {
      // Mock fetch response with invalid JSON
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"invalid": json}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      
      global.fetch.mockResolvedValue({
        ok: true,
        body: mockStream,
      });
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const onProgress = jest.fn();
      
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      });
      
      expect(result.content).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse Venice.ai chunk:',
        expect.any(String)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should pass context to formatRequest', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      
      global.fetch.mockResolvedValue({
        ok: true,
        body: mockStream,
      });
      
      const context = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];
      
      await provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress: jest.fn(),
        context,
      });
      
      // Verify formatRequest was called with context
      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.messages).toEqual([
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'Test prompt' },
      ]);
    });
  });

  describe('parseStreamChunk', () => {
    it('should parse valid stream chunk', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: 'Hello',
        reasoning: null,
        done: false,
      });
    });

    it('should handle DONE message', () => {
      const chunk = 'data: [DONE]';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        done: true,
      });
    });

    it('should handle invalid chunk format', () => {
      const chunk = 'invalid chunk';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toBeNull();
    });

    it('should handle invalid JSON', () => {
      const chunk = 'data: {"invalid": json}';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toBeNull();
    });

    it('should handle missing content', () => {
      const chunk = 'data: {"choices":[{"delta":{}}]}';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: '',
        reasoning: null,
        done: false,
      });
    });

    it('should parse reasoning content when available', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello","reasoning_content":"Thinking..."}}]}';
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: 'Hello',
        reasoning: 'Thinking...',
        done: false,
      });
    });
  });

  describe('parseResponse', () => {
    it('should parse response correctly', () => {
      const response = {
        choices: [{
          message: {
            content: 'Generated content',
            reasoning_content: 'Reasoning content',
          },
        }],
        model: 'llama-3.3-70b',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
        finish_reason: 'stop',
      };
      
      const result = provider.parseResponse(response);
      
      expect(result).toEqual({
        content: 'Generated content',
        reasoning: 'Reasoning content',
        model: 'llama-3.3-70b',
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
        finishReason: 'stop',
        provider: 'venice',
        anonymous: true,
        dataRetention: 'zero',
      });
    });

    it('should handle missing fields gracefully', () => {
      const response = {
        choices: [{}],
      };
      
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
        provider: 'venice',
        anonymous: true,
        dataRetention: 'zero',
      });
    });

    it('should handle missing choices', () => {
      const response = {};
      
      const result = provider.parseResponse(response);
      
      expect(result.content).toBe('');
      expect(result.reasoning).toBeNull();
    });
  });

  describe('getModels', () => {
    it('should return list of available models', async () => {
      const models = await provider.getModels();
      
      expect(models).toEqual([
        {
          id: 'llama-3.3-70b',
          name: 'Llama 3.3 70B',
          contextWindow: 128000,
          description: 'Meta\'s latest Llama model, excellent for complex tasks',
        },
        {
          id: 'qwen-2.5-72b',
          name: 'Qwen 2.5 72B',
          contextWindow: 32768,
          description: 'Alibaba\'s powerful multilingual model',
        },
        {
          id: 'dolphin-2.9.2-qwen2-72b',
          name: 'Dolphin 2.9.2 Qwen2 72B',
          contextWindow: 32768,
          description: 'Uncensored fine-tune of Qwen2',
        },
        {
          id: 'deepseek-r1',
          name: 'DeepSeek R1',
          contextWindow: 64000,
          description: 'Reasoning model with chain-of-thought capabilities',
        },
      ]);
    });
  });

  describe('setAnonymousMode', () => {
    it('should set anonymous mode correctly', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      provider.setAnonymousMode(false);
      
      expect(provider.anonymousMode).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Venice.ai anonymous mode: DISABLED'
      );
      
      consoleLogSpy.mockRestore();
    });

    it('should enable anonymous mode', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      provider.anonymousMode = false;
      provider.setAnonymousMode(true);
      
      expect(provider.anonymousMode).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Venice.ai anonymous mode: ENABLED'
      );
      
      consoleLogSpy.mockRestore();
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