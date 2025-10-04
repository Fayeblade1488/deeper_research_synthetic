/**
 * Test Setup Configuration
 * 
 * Global test configuration and utilities for the backend test suite.
 * Sets up common mocks, test utilities, and environment variables.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.PORT = '3001';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Global test utilities
global.testUtils = {
    /**
     * Create a mock project object for testing
     */
    createMockProject: (overrides = {}) => ({
        id: 'test-project-123',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context for validation and generation.',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 1,
        ...overrides
    }),

    /**
     * Create mock generation metadata
     */
    createMockMetadata: (overrides = {}) => ({
        wordCount: 1500,
        generationTime: 30000,
        framework: 'PROJECT_DEEPDIVE',
        validation: {
            valid: true,
            errors: [],
            warnings: []
        },
        timestamp: new Date().toISOString(),
        ...overrides
    }),

    /**
     * Create mock SSE chunk data
     */
    createSSEChunk: (data) => {
        return `data: ${JSON.stringify(data)}\n\n`;
    },

    /**
     * Sleep utility for async tests
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});

// Cleanup after all tests
afterAll(() => {
    // Ensure any active timeouts are cleared
    jest.useRealTimers();
});