/**
 * @file Provider factory unit tests
 * @description Unit tests for the ProviderFactory class
 */

const ProviderFactory = require('../../../services/providers/ProviderFactory');
const VeniceProvider = require('../../../services/providers/VeniceProvider');
const GeminiProvider = require('../../../services/providers/GeminiProvider');

// Mock environment variables
const originalEnv = process.env;

describe('ProviderFactory', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables after each test
    process.env = originalEnv;
  });

  describe('createProvider', () => {
    it('should create VeniceProvider when provider is venice', () => {
      const config = { apiKey: 'test-key' };
      const provider = ProviderFactory.createProvider('venice', config);
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
      expect(provider.apiKey).toBe('test-key');
    });

    it('should create GeminiProvider when provider is gemini', () => {
      const config = { apiKey: 'test-key' };
      const provider = ProviderFactory.createProvider('gemini', config);
      
      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.name).toBe('Google Gemini');
      expect(provider.apiKey).toBe('test-key');
    });

    it('should default to VeniceProvider for unknown providers', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = { apiKey: 'test-key' };
      const provider = ProviderFactory.createProvider('unknown', config);
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown provider "unknown", defaulting to Venice.ai for privacy'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle null or undefined provider gracefully', () => {
      const config = { apiKey: 'test-key' };
      const provider1 = ProviderFactory.createProvider(null, config);
      const provider2 = ProviderFactory.createProvider(undefined, config);
      
      expect(provider1).toBeInstanceOf(VeniceProvider);
      expect(provider1.name).toBe('Venice.ai');
      expect(provider2).toBeInstanceOf(VeniceProvider);
      expect(provider2.name).toBe('Venice.ai');
    });

    it('should handle empty provider string', () => {
      const config = { apiKey: 'test-key' };
      const provider = ProviderFactory.createProvider('', config);
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
    });

    it('should handle case insensitive provider names', () => {
      const config = { apiKey: 'test-key' };
      const provider1 = ProviderFactory.createProvider('VENICE', config);
      const provider2 = ProviderFactory.createProvider('GEMINI', config);
      const provider3 = ProviderFactory.createProvider('VeNiCe', config);
      const provider4 = ProviderFactory.createProvider('GeMiNi', config);
      
      expect(provider1).toBeInstanceOf(VeniceProvider);
      expect(provider1.name).toBe('Venice.ai');
      
      expect(provider2).toBeInstanceOf(GeminiProvider);
      expect(provider2.name).toBe('Google Gemini');
      
      expect(provider3).toBeInstanceOf(VeniceProvider);
      expect(provider3.name).toBe('Venice.ai');
      
      expect(provider4).toBeInstanceOf(GeminiProvider);
      expect(provider4.name).toBe('Google Gemini');
    });
  });

  describe('createFromEnv', () => {
    it('should create provider from VENICE_API_KEY environment variable', () => {
      process.env.VENICE_API_KEY = 'test-venice-key';
      process.env.AI_PROVIDER = 'venice';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
      expect(provider.apiKey).toBe('test-venice-key');
    });

    it('should create provider from GEMINI_API_KEY environment variable', () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.AI_PROVIDER = 'gemini';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.name).toBe('Google Gemini');
      expect(provider.apiKey).toBe('test-gemini-key');
    });

    it('should default to Venice.ai when no provider specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
      expect(provider.apiKey).toBe('test-key');
    });

    it('should handle anonymous mode correctly', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.ANONYMOUS_MODE = 'true';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.anonymousMode).toBe(true);
    });

    it('should disable anonymous mode when explicitly set to false', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.ANONYMOUS_MODE = 'false';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.anonymousMode).toBe(false);
    });

    it('should use default anonymous mode when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.anonymousMode).toBe(true); // Default is true
    });

    it('should use default temperature when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.temperature).toBe(0.7); // Default value
    });

    it('should use specified temperature when provided', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TEMPERATURE = '0.8';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.temperature).toBe(0.8);
    });

    it('should handle invalid temperature gracefully', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TEMPERATURE = 'invalid';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.temperature).toBe(0.7); // Default value
    });

    it('should use default max tokens when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.maxTokens).toBe(32000); // Default value
    });

    it('should use specified max tokens when provided', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.MAX_OUTPUT_TOKENS = '16000';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.maxTokens).toBe(16000);
    });

    it('should handle invalid max tokens gracefully', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.MAX_OUTPUT_TOKENS = 'invalid';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.maxTokens).toBe(32000); // Default value
    });

    it('should use default topP when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topP).toBe(0.95); // Default value
    });

    it('should use specified topP when provided', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TOP_P = '0.9';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topP).toBe(0.9);
    });

    it('should handle invalid topP gracefully', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TOP_P = 'invalid';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topP).toBe(0.95); // Default value
    });

    it('should use default topK when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topK).toBe(40); // Default value
    });

    it('should use specified topK when provided', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TOP_K = '20';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topK).toBe(20);
    });

    it('should handle invalid topK gracefully', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.TOP_K = 'invalid';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.topK).toBe(40); // Default value
    });

    it('should use default model when not specified', () => {
      process.env.VENICE_API_KEY = 'test-key';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.model).toBeUndefined(); // No default model
    });

    it('should use specified model when provided', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.MODEL = 'test-model';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.model).toBe('test-model');
    });

    it('should handle missing API keys gracefully', () => {
      // No API keys set
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider).toBeInstanceOf(VeniceProvider);
      expect(provider.name).toBe('Venice.ai');
      expect(provider.apiKey).toBeUndefined();
    });

    it('should handle enableWebSearch configuration', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.ENABLE_WEB_SEARCH = 'on';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.enableWebSearch).toBe('on');
    });

    it('should handle enableWebCitations configuration', () => {
      process.env.VENICE_API_KEY = 'test-key';
      process.env.ENABLE_WEB_CITATIONS = 'true';
      
      const provider = ProviderFactory.createFromEnv();
      
      expect(provider.config.enableWebCitations).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = ProviderFactory.getAvailableProviders();
      
      expect(providers).toEqual([
        {
          id: 'venice',
          name: 'Venice.ai',
          description: 'Privacy-first AI with zero data retention',
          privacyFocused: true,
          dataRetention: 'zero',
          openSource: true,
          uncensored: true,
          recommended: true,
          requiresApiKey: true,
          apiKeyEnv: 'VENICE_API_KEY',
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: "Google's advanced AI with long context support",
          privacyFocused: false,
          dataRetention: 'per Google Cloud terms',
          openSource: false,
          uncensored: false,
          recommended: false,
          requiresApiKey: true,
          apiKeyEnv: 'GEMINI_API_KEY',
        },
      ]);
    });
  });

  describe('validateConfig', () => {
    it('should validate Venice provider configuration correctly', () => {
      const config = { apiKey: 'test-key' };
      const result = ProviderFactory.validateConfig('venice', config);
      
      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should validate Gemini provider configuration correctly', () => {
      const config = { apiKey: 'test-key' };
      const result = ProviderFactory.validateConfig('gemini', config);
      
      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: [
          'Gemini stores data per Google Cloud terms - consider Venice.ai for privacy',
        ],
      });
    });

    it('should return validation errors for missing API key', () => {
      const config = {};
      const result = ProviderFactory.validateConfig('venice', config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config.');
    });

    it('should return validation errors for invalid provider', () => {
      const config = {};
      const result = ProviderFactory.validateConfig('invalid', config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid provider configuration');
    });

    it('should handle null provider gracefully', () => {
      const config = { apiKey: 'test-key' };
      const result = ProviderFactory.validateConfig(null, config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid provider configuration');
    });

    it('should handle undefined provider gracefully', () => {
      const config = { apiKey: 'test-key' };
      const result = ProviderFactory.validateConfig(undefined, config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid provider configuration');
    });

    it('should handle null config gracefully', () => {
      const result = ProviderFactory.validateConfig('venice', null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config.');
    });

    it('should handle undefined config gracefully', () => {
      const result = ProviderFactory.validateConfig('venice', undefined);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config.');
    });

    it('should handle empty config gracefully', () => {
      const result = ProviderFactory.validateConfig('venice', {});
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Venice.ai API key is required. Set VENICE_API_KEY environment variable or pass apiKey in config.');
    });
  });

  describe('getDefaultProvider', () => {
    it('should return Venice as default provider', () => {
      const defaultProvider = ProviderFactory.getDefaultProvider();
      
      expect(defaultProvider).toBe('venice');
    });
  });

  describe('PROVIDERS enum', () => {
    it('should export PROVIDERS enum with correct values', () => {
      expect(ProviderFactory.PROVIDERS).toEqual({
        VENICE: 'venice',
        GEMINI: 'gemini',
      });
    });
  });
});