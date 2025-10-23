/**
 * @file Performance benchmarking tools
 * @description Tools for measuring and benchmarking application performance
 */

const { performanceMonitor } = require('../services/performanceService');

/**
 * Performance benchmarking class
 * @class PerformanceBenchmark
 */
class PerformanceBenchmark {
  /**
   * Constructor
   */
  constructor() {
    this.results = [];
    this.currentBenchmark = null;
  }

  /**
   * Start a new benchmark
   * @param {string} name - Benchmark name
   * @param {Object} options - Benchmark options
   * @returns {void}
   */
  startBenchmark(name, options = {}) {
    this.currentBenchmark = {
      name,
      startTime: process.hrtime.bigint(),
      options,
      metrics: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }

  /**
   * End current benchmark and record results
   * @param {Object} additionalData - Additional data to record
   * @returns {Object} Benchmark results
   */
  endBenchmark(additionalData = {}) {
    if (!this.currentBenchmark) {
      throw new Error('No benchmark in progress');
    }

    const endTime = process.hrtime.bigint();
    const durationNs = endTime - this.currentBenchmark.startTime;
    const durationMs = Number(durationNs) / 1000000;

    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(this.currentBenchmark.metrics.cpu);

    const result = {
      name: this.currentBenchmark.name,
      duration: durationMs,
      memory: {
        rss: endMemory.rss - this.currentBenchmark.metrics.memory.rss,
        heapUsed: endMemory.heapUsed - this.currentBenchmark.metrics.memory.heapUsed,
        heapTotal: endMemory.heapTotal - this.currentBenchmark.metrics.memory.heapTotal,
      },
      cpu: {
        user: endCpu.user,
        system: endCpu.system,
      },
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    this.results.push(result);
    this.currentBenchmark = null;

    return result;
  }

  /**
   * Run a function and benchmark its performance
   * @param {string} name - Benchmark name
   * @param {Function} fn - Function to benchmark
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmark(name, fn, options = {}) {
    this.startBenchmark(name, options);

    try {
      const result = await fn();
      const benchmarkResult = this.endBenchmark({ success: true });
      return { ...benchmarkResult, result };
    } catch (error) {
      const benchmarkResult = this.endBenchmark({ success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Run multiple iterations of a function and benchmark average performance
   * @param {string} name - Benchmark name
   * @param {Function} fn - Function to benchmark
   * @param {number} iterations - Number of iterations
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Average benchmark results
   */
  async benchmarkIterations(name, fn, iterations = 10, options = {}) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.benchmark(`${name}-iteration-${i}`, fn, options);
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    // Calculate averages
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const avgMemoryRSS = successfulResults.reduce((sum, r) => sum + r.memory.rss, 0) / successfulResults.length;
    const avgMemoryHeapUsed = successfulResults.reduce((sum, r) => sum + r.memory.heapUsed, 0) / successfulResults.length;
    const avgMemoryHeapTotal = successfulResults.reduce((sum, r) => sum + r.memory.heapTotal, 0) / successfulResults.length;
    const avgCpuUser = successfulResults.reduce((sum, r) => sum + r.cpu.user, 0) / successfulResults.length;
    const avgCpuSystem = successfulResults.reduce((sum, r) => sum + r.cpu.system, 0) / successfulResults.length;

    const averageResult = {
      name: `${name}-average`,
      iterations: {
        total: iterations,
        successful: successfulResults.length,
        failed: failedResults.length,
        successRate: successfulResults.length / iterations,
      },
      duration: avgDuration,
      memory: {
        rss: avgMemoryRSS,
        heapUsed: avgMemoryHeapUsed,
        heapTotal: avgMemoryHeapTotal,
      },
      cpu: {
        user: avgCpuUser,
        system: avgCpuSystem,
      },
      timestamp: new Date().toISOString(),
      individualResults: results,
    };

    this.results.push(averageResult);
    return averageResult;
  }

  /**
   * Benchmark HTTP request performance
   * @param {string} name - Benchmark name
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmarkHttpRequest(name, url, options = {}) {
    const { method = 'GET', headers = {}, body = null } = options;

    return await this.benchmark(name, async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null,
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        return {
          status: response.status,
          responseTime,
          url,
          method,
        };
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        throw new Error(`HTTP request failed: ${error.message} (took ${responseTime}ms)`);
      }
    });
  }

  /**
   * Benchmark database operation performance
   * @param {string} name - Benchmark name
   * @param {Function} dbOperation - Database operation function
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmarkDatabaseOperation(name, dbOperation) {
    return await this.benchmark(name, async () => {
      // Track database-specific metrics
      const dbStartTime = performanceMonitor.metrics.totalRequests;
      const dbStartErrors = performanceMonitor.metrics.errors;
      
      try {
        const result = await dbOperation();
        
        const dbEndTime = performanceMonitor.metrics.totalRequests;
        const dbEndErrors = performanceMonitor.metrics.errors;
        
        return {
          result,
          dbRequests: dbEndTime - dbStartTime,
          dbErrors: dbEndErrors - dbStartErrors,
        };
      } catch (error) {
        const dbEndTime = performanceMonitor.metrics.totalRequests;
        const dbEndErrors = performanceMonitor.metrics.errors;
        
        throw new Error(`Database operation failed: ${error.message} (${dbEndErrors - dbStartErrors} errors in ${dbEndTime - dbStartTime} requests)`);
      }
    });
  }

  /**
   * Benchmark AI generation performance
   * @param {string} name - Benchmark name
   * @param {Function} generationFunction - AI generation function
   * @returns {Promise<Object>} Benchmark results
   */
  async benchmarkAIGeneration(name, generationFunction) {
    return await this.benchmark(name, async () => {
      // Track AI-specific metrics
      const aiStartGenerations = performanceMonitor.metrics.activeGenerations;
      const aiStartTime = performanceMonitor.metrics.totalRequests;
      const aiStartErrors = performanceMonitor.metrics.errors;
      
      try {
        const result = await generationFunction();
        
        const aiEndGenerations = performanceMonitor.metrics.activeGenerations;
        const aiEndTime = performanceMonitor.metrics.totalRequests;
        const aiEndErrors = performanceMonitor.metrics.errors;
        
        return {
          result,
          aiGenerations: aiEndGenerations - aiStartGenerations,
          aiRequests: aiEndTime - aiStartTime,
          aiErrors: aiEndErrors - aiStartErrors,
        };
      } catch (error) {
        const aiEndGenerations = performanceMonitor.metrics.activeGenerations;
        const aiEndTime = performanceMonitor.metrics.totalRequests;
        const aiEndErrors = performanceMonitor.metrics.errors;
        
        throw new Error(`AI generation failed: ${error.message} (${aiEndErrors - aiStartErrors} errors in ${aiEndTime - aiStartTime} requests, ${aiEndGenerations - aiStartGenerations} active generations)`);
      }
    });
  }

  /**
   * Get all benchmark results
   * @returns {Array<Object>} All benchmark results
   */
  getResults() {
    return [...this.results];
  }

  /**
   * Clear benchmark results
   * @returns {void}
   */
  clearResults() {
    this.results = [];
  }

  /**
   * Generate performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const results = this.getResults();
    
    if (results.length === 0) {
      return {
        message: 'No benchmarks run yet',
        timestamp: new Date().toISOString(),
      };
    }

    // Group results by name
    const groupedResults = {};
    results.forEach(result => {
      if (!groupedResults[result.name]) {
        groupedResults[result.name] = [];
      }
      groupedResults[result.name].push(result);
    });

    // Calculate statistics for each group
    const statistics = {};
    Object.keys(groupedResults).forEach(name => {
      const group = groupedResults[name];
      const durations = group.map(r => r.duration);
      const memoryRSS = group.map(r => r.memory.rss);
      const memoryHeapUsed = group.map(r => r.memory.heapUsed);
      
      statistics[name] = {
        count: group.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        avgMemoryRSS: memoryRSS.reduce((a, b) => a + b, 0) / memoryRSS.length,
        avgMemoryHeapUsed: memoryHeapUsed.reduce((a, b) => a + b, 0) / memoryHeapUsed.length,
        successRate: group.filter(r => r.success !== false).length / group.length,
      };
    });

    return {
      timestamp: new Date().toISOString(),
      totalBenchmarks: results.length,
      statistics,
      results,
    };
  }

  /**
   * Export results to JSON
   * @returns {string} JSON string of results
   */
  exportToJson() {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Export results to CSV
   * @returns {string} CSV string of results
   */
  exportToCsv() {
    const results = this.getResults();
    
    if (results.length === 0) {
      return 'No benchmarks run yet';
    }

    // CSV header
    let csv = 'name,duration,success,timestamp,memory_rss,memory_heapUsed,memory_heapTotal,cpu_user,cpu_system\n';
    
    // CSV rows
    results.forEach(result => {
      csv += `"${result.name}",${result.duration},${result.success !== false},"${result.timestamp}",${result.memory.rss},${result.memory.heapUsed},${result.memory.heapTotal},${result.cpu.user},${result.cpu.system}\n`;
    });
    
    return csv;
  }
}

// Export singleton instance
module.exports = new PerformanceBenchmark();