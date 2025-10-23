/**
 * API Service Test Suite
 *
 * Tests the frontend API service including:
 * - Buffer overflow protection (BUG-M3)
 * - Retry logic improvements (BUG-m1)
 * - Error state management (BUG-m4)
 * - SSE stream handling
 */

/* eslint-disable no-unused-vars */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelGeneration,
  checkGenerationStatus,
  checkServerStatus,
  createProject,
  deleteProject,
  fetchProjects,
  startGeneration,
  updateProject,
} from "../../src/services/apiService";

// Mock fetch globally
globalThis.fetch = vi.fn();

describe("API Service", () => {
  beforeEach(() => {
    // Reset all mocks completely before each test
    globalThis.fetch.mockClear();
    globalThis.fetch.mockReset();
    console.error = vi.fn(); // Suppress error logs in tests
  });

  describe("Project CRUD Operations", () => {
    it("should fetch projects successfully", async () => {
      const mockProjects = [
        { id: "1", name: "Test Project", framework: "PROJECT_DEEPDIVE" },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      });

      const result = await fetchProjects();
      expect(result).toEqual(mockProjects);
      expect(fetch).toHaveBeenCalledWith("http://localhost:3001/api/projects");
    });

    it("should handle fetch errors", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchProjects()).rejects.toThrow("Failed to fetch projects");
    });

    it("should create project with correct data", async () => {
      const newProject = {
        id: "123",
        name: "New Project",
        framework: "PROJECT_SYNTHETIC",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newProject),
      });

      const result = await createProject("New Project", "PROJECT_SYNTHETIC");

      expect(result).toEqual(newProject);
      expect(fetch).toHaveBeenCalledWith("http://localhost:3001/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Project",
          framework: "PROJECT_SYNTHETIC",
        }),
      });
    });

    it("should update project correctly", async () => {
      const updatedProject = {
        id: "123",
        name: "Updated Project",
        sourceContext: "New source",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedProject),
      });

      const result = await updateProject("123", {
        sourceContext: "New source",
      });

      expect(result).toEqual(updatedProject);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/projects/123",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceContext: "New source" }),
        }
      );
    });

    it("should delete project successfully", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteProject("123");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/projects/123",
        {
          method: "DELETE",
        }
      );
    });
  });

  describe("Generation Operations", () => {
    it("should check generation status", async () => {
      const mockStatus = { active: false };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await checkGenerationStatus("test-project");

      expect(result).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/generate/test-project/status"
      );
    });

    it("should cancel generation", async () => {
      const mockResponse = { message: "Generation cancelled" };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await cancelGeneration("test-project");

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/generate/test-project",
        {
          method: "DELETE",
        }
      );
    });
  });

  describe("Server Status", () => {
    it("should check server status", async () => {
      const mockStatus = {
        status: "THE FORGE is operational",
        projectCount: 5,
        geminiConfigured: true,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await checkServerStatus();

      expect(result).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith("http://localhost:3001/api/status");
    });
  });

  describe("Generation Streaming (BUG Fixes)", () => {
    let mockReadableStream;
    let mockReader;

    beforeEach(() => {
      // Reset ALL mocks before each Generation Streaming test
      globalThis.fetch.mockClear();
      globalThis.fetch.mockReset();
      
      mockReader = {
        read: vi.fn(),
        cancel: vi.fn().mockResolvedValue(),
      };

      mockReadableStream = {
        getReader: () => mockReader,
      };

      fetch.mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      });
    });

    describe("Buffer Overflow Protection (BUG-M3 Fix)", () => {
      it("should handle large buffer safely", async () => {
        const project = {
          id: "test-project",
          name: "Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Simulate malformed SSE data without delimiters
        const malformedChunk = new TextEncoder().encode(
          "data: " + "x".repeat(2000000)
        ); // 2MB chunk

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: malformedChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        let errorReceived = false;

        const cleanup = startGeneration(
          project,
          (progress) => {
            // Should not receive progress due to buffer overflow
          },
          (complete) => {
            // Should not complete
          },
          (error) => {
            errorReceived = true;
            expect(error.error || error).toContain(
              "buffer exceeded maximum size"
            );
          }
        );

        // Wait for error
        return new Promise((resolve) => {
          setTimeout(() => {
            cleanup();
            resolve();
          }, 1000);
        });
      });
    });

    describe("Enhanced Error State Management (BUG-m4 Fix)", () => {
      it("should include project ID in error callback", async () => {
        const project = {
          id: "error-test-project",
          name: "Error Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Mock SSE error response
        const errorChunk = new TextEncoder().encode(
          'data: {"type": "error", "error": "Generation failed"}\n\n'
        );

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: errorChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        return new Promise((resolve, reject) => {
          startGeneration(
            project,
            (progress) => {},
            (complete) => {},
            (errorData) => {
              try {
                // Should receive error object with project ID
                expect(errorData).toHaveProperty("projectId", "error-test-project");
                expect(errorData).toHaveProperty("error", "Generation failed");
                expect(errorData).toHaveProperty("timestamp");
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      });
    });

    describe("Retry Logic Enhancement (BUG-m1 Fix)", () => {
      it("should retry on HTTP 5xx errors", async () => {
        const project = {
          id: "retry-test",
          name: "Retry Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Mock server error on first attempt
        fetch
          .mockRejectedValueOnce(
            new Error("HTTP 503: Service temporarily unavailable")
          )
          .mockResolvedValueOnce({
            ok: true,
            body: mockReadableStream,
          });

        // Mock successful response after retry
        const successChunk = new TextEncoder().encode(
          'data: {"type": "complete", "content": "Success after retry"}\n\n'
        );

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: successChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        return new Promise((resolve, reject) => {
          let retryAttempted = false;

          startGeneration(
            project,
            (progress) => {},
            (complete) => {
              retryAttempted = true;
              try {
                expect(complete.content).toBe("Success after retry");
                expect(fetch).toHaveBeenCalledTimes(2); // Original + 1 retry
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            (error) => {
              if (!retryAttempted) {
                // This might be called during retry attempts, that's OK
                return;
              }
              reject(new Error(`Should have succeeded after retry: ${error}`));
            }
          );

          // Allow time for retry
          setTimeout(() => {
            if (!retryAttempted) {
              reject(new Error("Retry was not attempted"));
            }
          }, 2000);
        });
      }, 5000);

      it("should not retry on non-retryable errors", async () => {
        const project = {
          id: "no-retry-test",
          name: "No Retry Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Mock client error (should not retry)
        fetch.mockRejectedValueOnce(new Error("HTTP 400: Bad request"));

        return new Promise((resolve, reject) => {
          startGeneration(
            project,
            (progress) => {},
            (complete) => {
              reject(new Error("Should not have completed"));
            },
            (error) => {
              try {
                expect(error).toContain("HTTP 400");
                expect(fetch).toHaveBeenCalledTimes(1); // No retry
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          );
        });
      });
    });

    describe("Stream Processing", () => {
      it("should handle progress updates correctly", async () => {
        const project = {
          id: "progress-test",
          name: "Progress Test",
          framework: "PROJECT_DEEPDIVE",
        };

        const progressChunk = new TextEncoder().encode(
          'data: {"type": "progress", "step": "analyzing", "progress": 50}\n\n'
        );

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: progressChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        return new Promise((resolve, reject) => {
          startGeneration(
            project,
            (progress) => {
              try {
                expect(progress.type).toBe("progress");
                expect(progress.step).toBe("analyzing");
                expect(progress.progress).toBe(50);
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            (complete) => {},
            (error) => {
              reject(new Error(`Unexpected error: ${error}`));
            }
          );
        });
      });

      it("should handle completion correctly", async () => {
        const project = {
          id: "complete-test",
          name: "Complete Test",
          framework: "PROJECT_DEEPDIVE",
        };

        const completeChunk = new TextEncoder().encode(
          'data: {"type": "complete", "content": "Generated content", "metadata": {"wordCount": 1500}}\n\n'
        );

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: completeChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        return new Promise((resolve, reject) => {
          startGeneration(
            project,
            (progress) => {},
            (complete) => {
              try {
                expect(complete.type).toBe("complete");
                expect(complete.content).toBe("Generated content");
                expect(complete.metadata.wordCount).toBe(1500);
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            (error) => {
              reject(new Error(`Unexpected error: ${error}`));
            }
          );
        });
      });

      it("should handle malformed JSON gracefully", async () => {
        const project = {
          id: "malformed-test",
          name: "Malformed Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Send malformed JSON
        const malformedChunk = new TextEncoder().encode(
          'data: {"type": "progress", "step": "analyzing", invalid json}\n\n'
        );

        const validChunk = new TextEncoder().encode(
          'data: {"type": "complete", "content": "Success despite malformed"}\n\n'
        );

        mockReader.read
          .mockResolvedValueOnce({
            done: false,
            value: malformedChunk,
          })
          .mockResolvedValueOnce({
            done: false,
            value: validChunk,
          })
          .mockResolvedValueOnce({
            done: true,
          });

        return new Promise((resolve, reject) => {
          startGeneration(
            project,
            (progress) => {
              // Should not receive progress from malformed message
            },
            (complete) => {
              // Should still complete with valid message
              try {
                expect(complete.content).toBe("Success despite malformed");
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            (error) => {
              reject(new Error(`Should not fail: ${error}`));
            }
          );
        });
      });
    });

    describe("Cleanup and Memory Management", () => {
      it("should properly cleanup on manual cancellation", (done) => {
        const project = {
          id: "cleanup-test",
          name: "Cleanup Test",
          framework: "PROJECT_DEEPDIVE",
        };

        // Mock never-ending stream
        mockReader.read.mockImplementation(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate long-running stream
            })
        );

        const cleanup = startGeneration(
          project,
          (progress) => {},
          (complete) => {
            done(new Error("Should not complete"));
          },
          (error) => {
            done(new Error(`Should not error: ${error}`));
          }
        );

        // Cleanup immediately
        setTimeout(() => {
          cleanup();

          // Verify reader was cancelled
          setTimeout(() => {
            expect(mockReader.cancel).toHaveBeenCalled();
            done();
          }, 100);
        }, 50);
      });
    });
  });
});
