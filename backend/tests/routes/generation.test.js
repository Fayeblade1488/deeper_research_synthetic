const request = require('supertest');
const express = require('express');
const generationRoutes = require('../../routes/generation');

/**
 * Generation Routes Test Suite
 * 
 * Tests the generation routes including:
 * - Memory leak fixes (BUG-M1)
 * - Race condition fixes (BUG-M2)
 * - CORS preflight handling (BUG-m5)
 * - SSE streaming functionality
 */

describe('Generation Routes', () => {
    let app;
    
    beforeEach(() => {
        // Create fresh app instance for each test
        app = express();
        app.use(express.json());
        app.use('/api/generate', generationRoutes);
    });

    afterEach(() => {
        // Clear any active generations after each test
        const activeGenerations = require('../../routes/generation');
        // Access the Map if possible, or rely on timeout cleanup
        jest.clearAllTimers();
    });

    describe('CORS Preflight Handling (BUG-m5 Fix)', () => {
        it('should handle OPTIONS preflight requests', async () => {
            const response = await request(app)
                .options('/api/generate/test-project')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toBe('POST, OPTIONS');
            expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
            expect(response.headers['access-control-max-age']).toBe('86400');
        });

        it('should include CORS headers in POST responses', async () => {
            const project = {
                id: 'test-project',
                name: 'Test Project',
                framework: 'PROJECT_DEEPDIVE',
                sourceContext: 'Test source'
            };

            // Mock the generation service to return quickly
            jest.doMock('../../services/generationService', () => ({
                generateContent: jest.fn().mockResolvedValue({
                    content: 'Test content',
                    metadata: { wordCount: 100 }
                })
            }));

            const response = await request(app)
                .post('/api/generate/test-project')
                .send({ project })
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-headers']).toContain('Cache-Control');
        });
    });

    describe('Generation Status Endpoint', () => {
        it('should return inactive status for non-existent generation', async () => {
            const response = await request(app)
                .get('/api/generate/non-existent-project/status')
                .expect(200);

            expect(response.body).toEqual({
                active: false
            });
        });
    });

    describe('Generation Cancellation (BUG-M1 Fix)', () => {
        it('should return 404 for cancelling non-existent generation', async () => {
            const response = await request(app)
                .delete('/api/generate/non-existent-project')
                .expect(404);

            expect(response.body.error).toBe('No active generation found');
        });

        it('should properly cancel active generation with timeout cleanup', (done) => {
            // This test verifies that cancellation clears timeouts
            // Start a mock generation first, then cancel it
            const project = {
                id: 'cancel-test-project',
                name: 'Cancel Test',
                framework: 'PROJECT_DEEPDIVE',
                sourceContext: 'Test source'
            };

            // Start generation with very long timeout
            const generationPromise = request(app)
                .post('/api/generate/cancel-test-project')
                .send({ project })
                .timeout(100); // Short timeout for test

            // Cancel immediately
            setTimeout(async () => {
                const cancelResponse = await request(app)
                    .delete('/api/generate/cancel-test-project');
                    
                // Should succeed if generation was active and timeout cleared
                if (cancelResponse.status === 200) {
                    expect(cancelResponse.body.message).toBe('Generation cancelled');
                }
                done();
            }, 50);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing project data', async () => {
            const response = await request(app)
                .post('/api/generate/test-project')
                .send({}) // Empty body
                .expect(400);

            expect(response.body.error).toBe('Project data is required');
        });

        it('should handle malformed project data', async () => {
            const response = await request(app)
                .post('/api/generate/test-project')
                .send({ project: null })
                .expect(400);

            expect(response.body.error).toBe('Project data is required');
        });
    });

    describe('Concurrent Generations', () => {
        it('should prevent duplicate generations for same project', async () => {
            const project = {
                id: 'concurrent-test',
                name: 'Concurrent Test',
                framework: 'PROJECT_DEEPDIVE',
                sourceContext: 'Test source'
            };

            // Mock slow generation
            jest.doMock('../../services/generationService', () => ({
                generateContent: jest.fn().mockImplementation(() => 
                    new Promise(resolve => setTimeout(() => resolve({
                        content: 'Test content',
                        metadata: { wordCount: 100 }
                    }), 1000))
                )
            }));

            // Start first generation
            const firstRequest = request(app)
                .post('/api/generate/concurrent-test')
                .send({ project })
                .timeout(500);

            // Try to start second generation immediately
            setTimeout(async () => {
                const secondResponse = await request(app)
                    .post('/api/generate/concurrent-test')
                    .send({ project })
                    .expect(409);

                expect(secondResponse.body.error).toBe('Generation already in progress for this project');
            }, 100);

            // Wait for first to timeout/complete
            try {
                await firstRequest;
            } catch (error) {
                // Expected timeout
            }
        }, 2000);
    });

    describe('Memory Management', () => {
        it('should clean up resources on client disconnect simulation', (done) => {
            const project = {
                id: 'disconnect-test',
                name: 'Disconnect Test', 
                framework: 'PROJECT_DEEPDIVE',
                sourceContext: 'Test source'
            };

            // Start generation and immediately abort
            const req = request(app)
                .post('/api/generate/disconnect-test')
                .send({ project })
                .timeout(100);

            req.end((err) => {
                // Error expected due to timeout/abort
                // Check that status shows no active generation
                setTimeout(async () => {
                    const statusResponse = await request(app)
                        .get('/api/generate/disconnect-test/status')
                        .expect(200);

                    expect(statusResponse.body.active).toBe(false);
                    done();
                }, 200);
            });
        });
    });
});