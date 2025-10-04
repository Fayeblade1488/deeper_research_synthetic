module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js',
        '**/*.test.js'
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        'config/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!coverage/**'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000, // 10 seconds for async tests
    verbose: true
};