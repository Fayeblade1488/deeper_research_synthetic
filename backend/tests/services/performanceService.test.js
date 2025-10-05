/**
 * @file This file contains tests for the performance monitoring service.
 * @author Paradroid AI
 * @version 1.0.0
 */
const { performanceMonitor } = require('../../services/performanceService');

describe('Performance Service', () => {
  beforeEach(() => {
    // Reset the monitor before each test to ensure isolation
    performanceMonitor.reset();
  });

  it('should initialize with default metrics', () => {
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.status).toBe('Idle');
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.activeGenerations).toBe(0);
    expect(metrics.errors).toBe(0);
  });

  it('should increment total requests', () => {
    performanceMonitor.logRequest();
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.totalRequests).toBe(1);
  });

  it('should start and stop a generation task', () => {
    const taskId = 'gen-123';
    performanceMonitor.startGeneration(taskId);
    let metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(1);
    expect(metrics.status).toBe('Busy');

    performanceMonitor.endGeneration(taskId);
    metrics = performanceMonitor.getMetrics();
    expect(metrics.activeGenerations).toBe(0);
    expect(metrics.status).toBe('Idle');
  });

  it('should log an error', () => {
    performanceMonitor.logError();
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.errors).toBe(1);
  });

  it('should update thresholds', () => {
    const newThresholds = {
      highCpuThreshold: 95,
      highMemoryThreshold: 90,
    };
    performanceMonitor.updateThresholds(newThresholds);
    expect(performanceMonitor.thresholds.highCpuThreshold).toBe(95);
    expect(performanceMonitor.thresholds.highMemoryThreshold).toBe(90);
  });

  it('should generate a performance report', () => {
    performanceMonitor.logRequest();
    performanceMonitor.logRequest();
    performanceMonitor.logError();
    const report = performanceMonitor.generatePerformanceReport();

    expect(report.analysis).toBeDefined();
    expect(report.metrics.totalRequests).toBe(2);
    expect(report.metrics.errors).toBe(1);
    expect(report.analysis.errorRate).toBe(0.5);
  });
});