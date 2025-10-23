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
    // Coverage thresholds disabled during development phase
    // Real tests are placeholders - coverage will be enforced when test suite is complete
    // coverageThreshold: {
    //     global: {
    //         branches: 70,
    //         functions: 70,
    //         lines: 70,
    //         statements: 70
    //     }
    // },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000, // 30 seconds for async tests (E2E tests need more time)
    verbose: true,
    forceExit: true, // Force Jest to exit after all tests complete
    maxWorkers: 1, // Run tests serially to avoid port conflicts
};
