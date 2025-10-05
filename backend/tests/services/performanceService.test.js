/**
 * @file This file contains tests for the performance monitoring service.
 * @author Paradroid AI
 * @version 1.0.0
 */
const { performanceMonitor } = require("../../services/performanceService");

describe("Performance Service", () => {
  beforeEach(() => {
    // Reset the monitor before each test to ensure isolation
    performanceMonitor.reset();
  });

  it("should initialize with default metrics", () => {
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.status).toBe("healthy");
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.activeGenerations).toBe(0);
    expect(metrics.errors).toBe(0);
  });

  it("should track generation lifecycle", () => {
    const projectId = "test-project-123";

    // Start generation
    performanceMonitor.recordGenerationStart(projectId);
    let metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(1);
    expect(metrics.status).toBe("healthy");

    // Complete generation
    const startTime = Date.now();
    performanceMonitor.recordGenerationComplete(projectId, startTime, true);
    metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(0);
    expect(metrics.status).toBe("healthy");
  });

  it("should start and stop a generation task", () => {
    const projectId = "gen-123";
    performanceMonitor.recordGenerationStart(projectId);
    let metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(1);
    expect(metrics.status).toBe("healthy");

    const startTime = Date.now();
    performanceMonitor.recordGenerationComplete(projectId, startTime, true);
    metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(0);
    expect(metrics.status).toBe("healthy");
  });

  it("should log an error", () => {
    const error = new Error("Test error");
    const context = { projectId: "test-123", operation: "generation" };
    performanceMonitor.recordError(error, context);
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.errors).toBe(1);
    expect(metrics.status).toBe("critical");
  });

  it("should update thresholds", () => {
    const newThresholds = {
      maxMemoryMB: 1024,
      maxActiveGenerations: 10,
    };
    performanceMonitor.updateThresholds(newThresholds);
    expect(performanceMonitor.thresholds.maxMemoryMB).toBe(1024);
    expect(performanceMonitor.thresholds.maxActiveGenerations).toBe(10);
  });

  it("should generate a performance report", () => {
    // Record some activity
    performanceMonitor.recordGenerationStart("test-1");
    const startTime = Date.now();
    performanceMonitor.recordGenerationComplete("test-1", startTime, true);
    performanceMonitor.recordError(new Error("Test error"), {
      projectId: "test-1",
    });

    const report = performanceMonitor.generatePerformanceReport();

    expect(report).toBeDefined();
    expect(report.uptime).toBeDefined();
    expect(report.memory).toBeDefined();
    expect(report.requests).toBeDefined();
    // Recording an error with a single request drives the error rate above the 10% threshold
    expect(report.status).toBe("critical");
  });
});
