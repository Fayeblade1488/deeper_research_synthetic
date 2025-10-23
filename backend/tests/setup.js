/**
 * Jest Test Setup
 * Configures test environment for backend tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-api-key-for-ci';
process.env.VENICE_API_KEY = 'test-venice-key-for-ci';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(10000);
