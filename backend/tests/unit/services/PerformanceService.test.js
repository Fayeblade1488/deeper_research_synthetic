/**
 * @file Performance service unit tests
 * @description Unit tests for the PerformanceMonitor service
 */

const { PerformanceMonitor, performanceMonitor } = require('../../../services/performanceService');

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    // Create a new instance for each test to avoid state pollution
    monitor = new PerformanceMonitor();
    
    // Reset any timers or intervals
    monitor.stopMonitoring();
    
    // Reset metrics
    monitor.reset();
    
    // Clear all event listeners
    monitor.removeAllListeners();
  });

  afterEach(() => {
    // Clean up any remaining intervals
    monitor.stopMonitoring();
  });

  describe('constructor', () => {
    it('should initialize with default metrics', () => {
      expect(monitor.metrics).toEqual({
        memoryUsage: [],
        activeGenerations: 0,
        totalRequests: 0,
        errors: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        startTime: expect.any(Number),
      });
    });

    it('should initialize with default thresholds', () => {
      expect(monitor.thresholds).toEqual({
        maxMemoryMB: 512,
        maxActiveGenerations: 10,
        maxErrorRate: 0.1,
        maxResponseTime: 30000,
      });
    });

    it('should start monitoring automatically', () => {
      // Check that intervals were set
      expect(monitor.intervals.size).toBeGreaterThan(0);
      
      // Check specific interval names
      expect(monitor.intervals.has('memory')).toBe(true);
      expect(monitor.intervals.has('reports')).toBe(true);
    });
  });

  describe('recordGenerationStart', () => {
    it('should increment active generations and total requests', () => {
      const projectId = 'test-project-1';
      
      const result = monitor.recordGenerationStart(projectId);
      
      expect(monitor.metrics.activeGenerations).toBe(1);
      expect(monitor.metrics.totalRequests).toBe(1);
      expect(result.projectId).toBe(projectId);
      expect(result.startTime).toBeDefined();
      expect(result.memoryAtStart).toBeDefined();
    });

    it('should emit warning for high load', () => {
      const warnSpy = jest.spyOn(monitor, 'emit');
      
      // Set threshold to 1 for testing
      monitor.thresholds.maxActiveGenerations = 1;
      
      monitor.recordGenerationStart('project-1');
      monitor.recordGenerationStart('project-2');
      
      expect(warnSpy).toHaveBeenCalledWith('warning', expect.objectContaining({
        type: 'high_load',
        message: 'High concurrent generations: 2',
        activeGenerations: 2,
        threshold: 1,
      }));
    });
  });

  describe('recordGenerationComplete', () => {
    it('should decrement active generations and update response time', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      
      const result = monitor.recordGenerationComplete('test-project', startTime, true);
      
      expect(monitor.metrics.activeGenerations).toBe(0);
      expect(monitor.metrics.averageResponseTime).toBeGreaterThan(0);
      expect(result.projectId).toBe('test-project');
      expect(result.success).toBe(true);
      expect(result.duration).toBeCloseTo(1000, -2); // Approximately 1000ms
    });

    it('should emit warning for slow responses', () => {
      const warnSpy = jest.spyOn(monitor, 'emit');
      
      // Set threshold to 500ms for testing
      monitor.thresholds.maxResponseTime = 500;
      
      const startTime = Date.now() - 1000; // 1 second ago
      monitor.recordGenerationComplete('test-project', startTime, true);
      
      expect(warnSpy).toHaveBeenCalledWith('warning', expect.objectContaining({
        type: 'slow_response',
        message: 'Slow generation: 1000ms',
        projectId: 'test-project',
        duration: 1000,
        threshold: 500,
      }));
    });

    it('should increment error count for failed generations', () => {
      const startTime = Date.now();
      
      monitor.recordGenerationComplete('test-project', startTime, false);
      
      expect(monitor.metrics.errors).toBe(1);
    });
  });

  describe('recordError', () => {
    it('should increment error count', () => {
      const error = new Error('Test error');
      
      monitor.recordError(error);
      
      expect(monitor.metrics.errors).toBe(1);
    });

    it('should emit alert for high error rate', () => {
      const alertSpy = jest.spyOn(monitor, 'emit');
      
      // Set threshold to 50% for testing
      monitor.thresholds.maxErrorRate = 0.5;
      
      // Create enough requests to trigger high error rate
      monitor.metrics.totalRequests = 10;
      
      const error = new Error('Test error');
      monitor.recordError(error);
      
      // Error rate is now 1/10 = 10%, which is below threshold
      expect(alertSpy).not.toHaveBeenCalledWith('alert');
      
      // Add more errors to exceed threshold
      monitor.recordError(error);
      monitor.recordError(error);
      monitor.recordError(error);
      monitor.recordError(error);
      monitor.recordError(error);
      monitor.recordError(error);
      
      // Error rate is now 6/10 = 60%, which exceeds threshold
      expect(alertSpy).toHaveBeenCalledWith('alert', expect.objectContaining({
        type: 'high_error_rate',
        message: 'High error rate: 60.0%',
        errorRate: 0.6,
        totalErrors: 6,
        totalRequests: 10,
      }));
    });
  });

  describe('checkMemoryUsage', () => {
    it('should record memory usage', () => {
      const initialLength = monitor.metrics.memoryUsage.length;
      
      const usage = monitor.checkMemoryUsage();
      
      expect(monitor.metrics.memoryUsage.length).toBe(initialLength + 1);
      expect(usage.rss).toBeDefined();
      expect(usage.heapUsed).toBeDefined();
      expect(usage.heapTotal).toBeDefined();
      expect(usage.external).toBeDefined();
    });

    it('should update peak memory usage', () => {
      // Mock process.memoryUsage to return higher values
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        rss: 100 * 1024 * 1024, // 100MB
        heapTotal: 50 * 1024 * 1024, // 50MB
        heapUsed: 30 * 1024 * 1024, // 30MB
        external: 10 * 1024 * 1024, // 10MB
        arrayBuffers: 5 * 1024 * 1024, // 5MB
      });
      
      monitor.checkMemoryUsage();
      
      expect(monitor.metrics.peakMemoryUsage).toBe(100); // 100MB in MB
      
      // Restore original
      process.memoryUsage = originalMemoryUsage;
    });

    it('should emit alert for high memory usage', () => {
      const alertSpy = jest.spyOn(monitor, 'emit');
      
      // Set threshold to 50MB for testing
      monitor.thresholds.maxMemoryMB = 50;
      
      // Mock process.memoryUsage to return high values
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        rss: 100 * 1024 * 1024, // 100MB - above threshold
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      });
      
      monitor.checkMemoryUsage();
      
      expect(alertSpy).toHaveBeenCalledWith('alert', expect.objectContaining({
        type: 'high_memory_usage',
        message: 'High memory usage: 100MB',
        usage: expect.objectContaining({
          rss: 100,
        }),
        threshold: 50,
        activeGenerations: 0,
      }));
      
      // Restore original
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('calculateMemoryTrend', () => {
    it('should calculate memory trend correctly', () => {
      const usageHistory = [
        { rss: 50 },
        { rss: 55 },
        { rss: 60 },
        { rss: 65 },
        { rss: 70 },
      ];
      
      const trend = monitor.calculateMemoryTrend(usageHistory);
      
      expect(trend.isIncreasing).toBe(true);
      expect(trend.growthRate).toBeGreaterThan(0);
      expect(trend.correlation).toBeDefined();
    });

    it('should handle insufficient data', () => {
      const usageHistory = [{ rss: 50 }];
      
      const trend = monitor.calculateMemoryTrend(usageHistory);
      
      expect(trend.isIncreasing).toBe(false);
      expect(trend.growthRate).toBe(0);
    });

    it('should handle empty data', () => {
      const usageHistory = [];
      
      const trend = monitor.calculateMemoryTrend(usageHistory);
      
      expect(trend.isIncreasing).toBe(false);
      expect(trend.growthRate).toBe(0);
    });
  });

  describe('updateAverageResponseTime', () => {
    it('should update average response time using exponential moving average', () => {
      monitor.updateAverageResponseTime(1000); // First measurement
      expect(monitor.metrics.averageResponseTime).toBe(1000);
      
      monitor.updateAverageResponseTime(2000); // Second measurement
      // With alpha = 0.1: (1 - 0.1) * 1000 + 0.1 * 2000 = 900 + 200 = 1100
      expect(monitor.metrics.averageResponseTime).toBe(1100);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a complete performance report', () => {
      const reportSpy = jest.spyOn(monitor, 'emit');
      
      // Set some test metrics
      monitor.metrics.totalRequests = 100;
      monitor.metrics.errors = 5;
      monitor.metrics.averageResponseTime = 1500;
      
      const report = monitor.generatePerformanceReport();
      
      expect(report).toEqual(expect.objectContaining({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          current: expect.objectContaining({
            rss: expect.any(Number),
            heapUsed: expect.any(Number),
            heapTotal: expect.any(Number),
          }),
          peak: expect.any(Number),
          averageGrowth: expect.any(Number),
        }),
        requests: expect.objectContaining({
          total: 100,
          errors: 5,
          errorRate: 5,
          averageResponseTime: 1500,
        }),
        activeGenerations: 0,
        thresholds: monitor.thresholds,
        status: expect.any(String),
      }));
      
      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(report.status);
      
      // Verify report was emitted
      expect(reportSpy).toHaveBeenCalledWith('report', expect.any(Object));
    });
  });

  describe('getMetrics', () => {
    it('should return current performance metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        memoryUsage: [],
        activeGenerations: 0,
        totalRequests: 0,
        errors: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        startTime: expect.any(Number),
        currentMemory: expect.objectContaining({
          rss: expect.any(Number),
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        }),
        uptime: expect.any(Number),
        status: expect.any(String),
      }));
      
      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(metrics.status);
    });
  });

  describe('getMetricsAsync', () => {
    it('should return current performance metrics asynchronously', async () => {
      const metrics = await monitor.getMetricsAsync();
      
      expect(metrics).toEqual(expect.objectContaining({
        memoryUsage: [],
        activeGenerations: 0,
        totalRequests: 0,
        errors: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        startTime: expect.any(Number),
        currentMemory: expect.objectContaining({
          rss: expect.any(Number),
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
        }),
        uptime: expect.any(Number),
        status: expect.any(String),
      }));
      
      // Check status is one of the valid values
      expect(['healthy', 'warning', 'critical']).toContain(metrics.status);
    });
  });

  describe('reset', () => {
    it('should reset all metrics to initial values', () => {
      // Set some test values
      monitor.metrics.activeGenerations = 5;
      monitor.metrics.totalRequests = 100;
      monitor.metrics.errors = 10;
      monitor.metrics.averageResponseTime = 1500;
      monitor.metrics.peakMemoryUsage = 200;
      monitor.metrics.memoryUsage = [{ rss: 100 }];
      
      monitor.reset();
      
      expect(monitor.metrics).toEqual({
        memoryUsage: [],
        activeGenerations: 0,
        totalRequests: 0,
        errors: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        startTime: expect.any(Number),
      });
    });
  });

  describe('updateThresholds', () => {
    it('should update performance thresholds', () => {
      const newThresholds = {
        maxMemoryMB: 1024,
        maxActiveGenerations: 20,
        maxErrorRate: 0.05,
        maxResponseTime: 15000,
      };

      monitor.updateThresholds(newThresholds);
      
      expect(monitor.thresholds).toEqual(newThresholds);
    });

    it('should merge with existing thresholds', () => {
      const partialThresholds = {
        maxMemoryMB: 1024,
        maxErrorRate: 0.05,
      };
      
      const originalMaxActiveGenerations = monitor.thresholds.maxActiveGenerations;
      const originalMaxResponseTime = monitor.thresholds.maxResponseTime;
      
      monitor.updateThresholds(partialThresholds);
      
      expect(monitor.thresholds.maxMemoryMB).toBe(1024);
      expect(monitor.thresholds.maxErrorRate).toBe(0.05);
      expect(monitor.thresholds.maxActiveGenerations).toBe(originalMaxActiveGenerations);
      expect(monitor.thresholds.maxResponseTime).toBe(originalMaxResponseTime);
    });
  });

  describe('determineSystemStatus', () => {
    it('should return healthy status under normal conditions', () => {
      const status = monitor.determineSystemStatus();
      expect(status).toBe('healthy');
    });

    it('should return warning status when approaching thresholds', () => {
      // Set metrics to warning levels
      monitor.metrics.activeGenerations = 9; // 90% of threshold 10
      monitor.thresholds.maxActiveGenerations = 10;
      
      const status = monitor.determineSystemStatus();
      expect(status).toBe('warning');
    });

    it('should return critical status when exceeding thresholds', () => {
      // Set metrics to critical levels
      monitor.metrics.activeGenerations = 15; // Exceeds threshold 10
      monitor.thresholds.maxActiveGenerations = 10;
      
      const status = monitor.determineSystemStatus();
      expect(status).toBe('critical');
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop monitoring intervals', () => {
      // Stop monitoring first
      monitor.stopMonitoring();
      expect(monitor.intervals.size).toBe(0);
      
      // Start monitoring
      monitor.startMonitoring();
      expect(monitor.intervals.size).toBeGreaterThan(0);
      
      // Stop monitoring again
      monitor.stopMonitoring();
      expect(monitor.intervals.size).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('should emit warning events', () => {
      const warnSpy = jest.spyOn(monitor, 'emit');
      
      monitor.emit('warning', {
        type: 'test_warning',
        message: 'Test warning message',
      });
      
      expect(warnSpy).toHaveBeenCalledWith('warning', expect.objectContaining({
        type: 'test_warning',
        message: 'Test warning message',
      }));
    });

    it('should emit alert events', () => {
      const alertSpy = jest.spyOn(monitor, 'emit');
      
      monitor.emit('alert', {
        type: 'test_alert',
        message: 'Test alert message',
      });
      
      expect(alertSpy).toHaveBeenCalledWith('alert', expect.objectContaining({
        type: 'test_alert',
        message: 'Test alert message',
      }));
    });

    it('should emit report events', () => {
      const reportSpy = jest.spyOn(monitor, 'emit');
      
      monitor.emit('report', {
        timestamp: new Date().toISOString(),
        status: 'healthy',
      });
      
      expect(reportSpy).toHaveBeenCalledWith('report', expect.objectContaining({
        timestamp: expect.any(String),
        status: 'healthy',
      }));
    });
  });
});