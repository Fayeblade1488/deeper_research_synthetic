/**
 * @file Gemini provider unit tests
 * @description Unit tests for the GeminiProvider class
 */

const GeminiProvider = require('../../../services/providers/GeminiProvider');

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContentStream: jest.fn(),
        }),
      };
    }),
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    HarmBlockThreshold: {
      BLOCK_NONE: 'BLOCK_NONE',
      BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
      BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
      BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE',
    },
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('GeminiProvider', () => {
  let provider;
  let mockConfig;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up mock config
    mockConfig = {
      apiKey: 'test-api-key',
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxTokens: 32000,
      topP: 0.95,
      topK: 40,
    };
    
    // Create new provider instance
    provider = new GeminiProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.name).toBe('Google Gemini');
      expect(provider.apiKey).toBe('test-api-key');
      expect(provider.baseURL).toBe('https://generativelanguage.googleapis.com/v1beta');
    });

    it('should use environment variables when config not provided', () => {
      // Mock environment variables
      process.env.GEMINI_API_KEY = 'env-api-key';
      
      const providerWithEnv = new GeminiProvider({});
      
      expect(providerWithEnv.apiKey).toBe('env-api-key');
    });

    it('should handle missing API key gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const providerWithoutKey = new GeminiProvider({});
      
      expect(providerWithoutKey.apiKey).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Gemini API key not provided - generation will likely fail'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should initialize GoogleGenerativeAI client', () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      expect(() => provider.validateConfig()).not.toThrow();
    });

    it('should throw error for missing API key', () => {
      const providerWithoutKey = new GeminiProvider({});
      
      expect(() => providerWithoutKey.validateConfig()).toThrow(
        'Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config.'
      );
    });
  });

  describe('getInfo', () => {
    it('should return correct provider information', () => {
      const info = provider.getInfo();
      
      expect(info).toEqual({
        name: 'Google Gemini',
        privacyFocused: false,
        dataRetention: 'per Google Cloud terms',
        openSource: false,
        uncensored: false,
        apiCompatibility: ['google'],
        features: {
          anonymousMode: false,
          webSearch: false,
          webCitations: false,
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
        { role: 'model', content: 'Previous response' },
      ];
      
      const request = provider.formatRequest(systemPrompt, userPrompt, context);
      
      expect(request).toEqual({
        contents: [
          { role: 'user', parts: [{ text: 'Previous message' }] },
          { role: 'model', parts: [{ text: 'Previous response' }] },
          { role: 'user', parts: [{ text: 'User message' }] },
        ],
        systemInstruction: {
          parts: [{ text: 'System instructions' }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 32000,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });
    });

    it('should handle empty system prompt', () => {
      const systemPrompt = '';
      const userPrompt = 'User message';
      
      const request = provider.formatRequest(systemPrompt, userPrompt);
      
      expect(request.systemInstruction).toBeUndefined();
    });

    it('should handle empty context', () => {
      const systemPrompt = 'System instructions';
      const userPrompt = 'User message';
      const context = [];
      
      const request = provider.formatRequest(systemPrompt, userPrompt, context);
      
      expect(request.contents).toEqual([
        { role: 'user', parts: [{ text: 'User message' }] },
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
      
      expect(request.generationConfig.temperature).toBe(0.9);
    });

    it('should use custom max tokens when provided', () => {
      provider.config.maxTokens = 16000;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.generationConfig.maxOutputTokens).toBe(16000);
    });

    it('should use custom topP when provided', () => {
      provider.config.topP = 0.8;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.generationConfig.topP).toBe(0.8);
    });

    it('should use custom topK when provided', () => {
      provider.config.topK = 20;
      
      const request = provider.formatRequest('System', 'User');
      
      expect(request.generationConfig.topK).toBe(20);
    });
  });

  describe('generateWithStreaming', () => {
    it('should generate content with streaming', async () => {
      // Mock the Google Generative AI SDK methods
      const mockStreamResult = {
        stream: {
          [Symbol.asyncIterator]: async function* () {
            yield { text: () => 'Hello' };
            yield { text: () => ' World' };
            yield { text: () => '!' };
          },
        },
      };

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenerativeModel = {
        generateContentStream: jest.fn().mockResolvedValue(mockStreamResult),
      };
      
      GoogleGenerativeAI.mockImplementation(() => {
        return {
          getGenerativeModel: jest.fn().mockReturnValue(mockGenerativeModel),
        };
      });

      // Re-create provider with mocked SDK
      provider = new GeminiProvider(mockConfig);

      const onProgress = jest.fn();
      const result = await provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      });

      expect(result).toEqual({
        content: 'Hello World!',
        provider: 'gemini',
        anonymous: false,
        dataRetention: 'per Google Cloud terms',
        chunks: 3,
      });

      // Verify the SDK was called with correct parameters
      expect(mockGenerativeModel.generateContentStream).toHaveBeenCalledWith({
        contents: [
          { role: 'user', parts: [{ text: 'Test prompt' }] },
        ],
        systemInstruction: undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 32000,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });

      // Verify progress callbacks were called
      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello',
        chunks: 1,
        provider: 'gemini',
        estimatedProgress: expect.any(Number),
      });

      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello World',
        chunks: 2,
        provider: 'gemini',
        estimatedProgress: expect.any(Number),
      });

      expect(onProgress).toHaveBeenCalledWith({
        type: 'progress',
        content: 'Hello World!',
        chunks: 3,
        provider: 'gemini',
        estimatedProgress: expect.any(Number),
      });

      expect(onProgress).toHaveBeenCalledWith({
        type: 'complete',
        content: 'Hello World!',
        chunks: 3,
        provider: 'gemini',
      });
    });

    it('should handle SDK errors', async () => {
      // Mock the Google Generative AI SDK to throw an error
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenerativeModel = {
        generateContentStream: jest.fn().mockRejectedValue(new Error('SDK error')),
      };
      
      GoogleGenerativeAI.mockImplementation(() => {
        return {
          getGenerativeModel: jest.fn().mockReturnValue(mockGenerativeModel),
        };
      });

      // Re-create provider with mocked SDK
      provider = new GeminiProvider(mockConfig);

      const onProgress = jest.fn();

      await expect(provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      })).rejects.toThrow('Gemini generation failed: SDK error');

      // Verify error progress was sent
      expect(onProgress).toHaveBeenCalledWith({
        type: 'error',
        error: 'SDK error',
      });
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const onProgress = jest.fn();

      await expect(provider.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      })).rejects.toThrow('Gemini generation failed: Network error');
    });

    it('should handle missing API key', async () => {
      const providerWithoutKey = new GeminiProvider({});

      const onProgress = jest.fn();

      await expect(providerWithoutKey.generateWithStreaming({
        prompt: 'Test prompt',
        onProgress,
      })).rejects.toThrow('Gemini API key is required for generation');
    });
  });

  describe('parseStreamChunk', () => {
    it('should parse valid stream chunk', () => {
      const chunk = { text: () => 'Hello World' };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: 'Hello World',
        reasoning: null,
        done: false,
      });
    });

    it('should handle empty chunk', () => {
      const chunk = { text: () => '' };
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toEqual({
        content: '',
        reasoning: null,
        done: false,
      });
    });

    it('should handle null chunk', () => {
      const result = provider.parseStreamChunk(null);
      
      expect(result).toBeNull();
    });

    it('should handle chunk without text method', () => {
      const chunk = {};
      
      const result = provider.parseStreamChunk(chunk);
      
      expect(result).toBeNull();
    });
  });

  describe('parseResponse', () => {
    it('should parse response correctly', () => {
      const response = {
        response: {
          text: () => 'Generated content',
          candidates: [{
            content: {
              role: 'model',
              parts: [{ text: 'Generated content' }],
            },
            finishReason: 'STOP',
            tokenCount: 100,
          }],
          usageMetadata: {
            promptTokenCount: 50,
            candidatesTokenCount: 100,
            totalTokenCount: 150,
          },
        },
      };
      
      const result = provider.parseResponse(response);
      
      expect(result).toEqual({
        content: 'Generated content',
        reasoning: null,
        model: undefined,
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150,
        },
        finishReason: 'STOP',
        provider: 'gemini',
        anonymous: false,
        dataRetention: 'per Google Cloud terms',
      });
    });

    it('should handle missing response', () => {
      const response = {};
      
      const result = provider.parseResponse(response);
      
      expect(result.content).toBe('');
      expect(result.reasoning).toBeNull();
    });

    it('should handle missing text method', () => {
      const response = {
        response: {},
      };
      
      const result = provider.parseResponse(response);
      
      expect(result.content).toBe('');
      expect(result.reasoning).toBeNull();
    });

    it('should handle missing candidates', () => {
      const response = {
        response: {
          text: () => 'Generated content',
        },
      };
      
      const result = provider.parseResponse(response);
      
      expect(result.finishReason).toBeUndefined();
      expect(result.usage).toEqual({
        promptTokens: 0,
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
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          contextWindow: 1000000,
          description: 'Google\'s most capable multimodal model, optimized for complex tasks',
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          contextWindow: 1000000,
          description: 'Lightning fast multimodal model for high-volume tasks',
        },
        {
          id: 'gemini-2.0-flash-exp',
          name: 'Gemini 2.0 Flash Experimental',
          contextWindow: 1000000,
          description: 'Experimental next-generation model with enhanced capabilities',
        },
      ]);
    });
  });
});