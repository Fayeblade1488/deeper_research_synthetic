/**
 * Performance Monitoring and Optimization Service
 * 
 * Provides tools for monitoring memory usage, detecting performance issues,
 * and implementing optimizations to prevent DoS and resource exhaustion.
 */

const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            memoryUsage: [],
            activeGenerations: 0,
            totalRequests: 0,
            errors: 0,
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            startTime: Date.now()
        };
        
        this.thresholds = {
            maxMemoryMB: 512, // 512MB threshold
            maxActiveGenerations: 10,
            maxErrorRate: 0.1, // 10% error rate
            maxResponseTime: 30000 // 30 seconds
        };
        
        this.intervals = new Map();
        this.startMonitoring();
    }

    /**
     * Start performance monitoring with periodic checks
     */
    startMonitoring() {
        // Memory monitoring every 10 seconds
        this.intervals.set('memory', setInterval(() => {
            this.checkMemoryUsage();
        }, 10000));

        // Generate hourly performance reports
        this.intervals.set('reports', setInterval(() => {
            this.generatePerformanceReport();
        }, 3600000)); // 1 hour

        console.log('🔍 Performance monitoring started');
    }

    /**
     * Stop all monitoring intervals
     */
    stopMonitoring() {
        this.intervals.forEach((interval) => {
            clearInterval(interval);
        });
        this.intervals.clear();
        console.log('🛑 Performance monitoring stopped');
    }

    /**
     * Record a generation start
     */
    recordGenerationStart(projectId) {
        this.metrics.activeGenerations++;
        this.metrics.totalRequests++;
        
        if (this.metrics.activeGenerations > this.thresholds.maxActiveGenerations) {
            this.emit('warning', {
                type: 'high_load',
                message: `High concurrent generations: ${this.metrics.activeGenerations}`,
                activeGenerations: this.metrics.activeGenerations,
                threshold: this.thresholds.maxActiveGenerations
            });
        }

        return {
            projectId,
            startTime: Date.now(),
            memoryAtStart: process.memoryUsage()
        };
    }

    /**
     * Record a generation completion
     */
    recordGenerationComplete(projectId, startTime, success = true) {
        this.metrics.activeGenerations = Math.max(0, this.metrics.activeGenerations - 1);
        
        const duration = Date.now() - startTime;
        this.updateAverageResponseTime(duration);
        
        if (!success) {
            this.metrics.errors++;
        }

        if (duration > this.thresholds.maxResponseTime) {
            this.emit('warning', {
                type: 'slow_response',
                message: `Slow generation: ${duration}ms`,
                projectId,
                duration,
                threshold: this.thresholds.maxResponseTime
            });
        }

        return {
            projectId,
            duration,
            success,
            activeGenerations: this.metrics.activeGenerations
        };
    }

    /**
     * Record an error occurrence
     */
    recordError(error, context = {}) {
        this.metrics.errors++;
        
        const errorRate = this.metrics.errors / Math.max(1, this.metrics.totalRequests);
        if (errorRate > this.thresholds.maxErrorRate) {
            this.emit('alert', {
                type: 'high_error_rate',
                message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
                errorRate,
                totalErrors: this.metrics.errors,
                totalRequests: this.metrics.totalRequests,
                latestError: error.message,
                context
            });
        }
    }

    /**
     * Check current memory usage and emit warnings if necessary
     */
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const usageMB = {
            rss: Math.round(usage.rss / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024)
        };

        // Store memory usage history (keep last 100 measurements)
        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            ...usageMB
        });
        
        if (this.metrics.memoryUsage.length > 100) {
            this.metrics.memoryUsage.shift();
        }

        // Update peak memory usage
        if (usageMB.rss > this.metrics.peakMemoryUsage) {
            this.metrics.peakMemoryUsage = usageMB.rss;
        }

        // Check for memory threshold violations
        if (usageMB.rss > this.thresholds.maxMemoryMB) {
            this.emit('alert', {
                type: 'high_memory_usage',
                message: `High memory usage: ${usageMB.rss}MB`,
                usage: usageMB,
                threshold: this.thresholds.maxMemoryMB,
                activeGenerations: this.metrics.activeGenerations
            });
        }

        // Check for potential memory leaks (continuous growth)
        if (this.metrics.memoryUsage.length >= 10) {
            const recentUsage = this.metrics.memoryUsage.slice(-10);
            const trend = this.calculateMemoryTrend(recentUsage);
            
            if (trend.isIncreasing && trend.growthRate > 5) { // 5MB per measurement
                this.emit('warning', {
                    type: 'memory_leak_suspected',
                    message: `Potential memory leak detected (growth: ${trend.growthRate.toFixed(1)}MB/measurement)`,
                    trend,
                    recentUsage: recentUsage.slice(-5)
                });
            }
        }

        return usageMB;
    }

    /**
     * Calculate memory usage trend
     */
    calculateMemoryTrend(usageHistory) {
        if (usageHistory.length < 2) {
            return { isIncreasing: false, growthRate: 0 };
        }

        const values = usageHistory.map(u => u.rss);
        const n = values.length;
        
        // Simple linear regression to detect trend
        const sum_x = n * (n - 1) / 2;
        const sum_y = values.reduce((a, b) => a + b, 0);
        const sum_xy = values.reduce((sum, y, i) => sum + i * y, 0);
        const sum_xx = n * (n - 1) * (2 * n - 1) / 6;
        
        const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        
        return {
            isIncreasing: slope > 0,
            growthRate: slope,
            correlation: this.calculateCorrelation(usageHistory)
        };
    }

    /**
     * Calculate correlation coefficient for trend strength
     */
    calculateCorrelation(usageHistory) {
        const n = usageHistory.length;
        const x_values = usageHistory.map((_, i) => i);
        const y_values = usageHistory.map(u => u.rss);
        
        const mean_x = x_values.reduce((a, b) => a + b) / n;
        const mean_y = y_values.reduce((a, b) => a + b) / n;
        
        const num = x_values.reduce((sum, x, i) => sum + (x - mean_x) * (y_values[i] - mean_y), 0);
        const den_x = Math.sqrt(x_values.reduce((sum, x) => sum + (x - mean_x) ** 2, 0));
        const den_y = Math.sqrt(y_values.reduce((sum, y) => sum + (y - mean_y) ** 2, 0));
        
        return den_x * den_y === 0 ? 0 : num / (den_x * den_y);
    }

    /**
     * Update running average response time
     */
    updateAverageResponseTime(duration) {
        const alpha = 0.1; // Exponential moving average factor
        this.metrics.averageResponseTime = this.metrics.averageResponseTime === 0 
            ? duration 
            : (1 - alpha) * this.metrics.averageResponseTime + alpha * duration;
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const uptime = Date.now() - this.metrics.startTime;
        const currentMemory = process.memoryUsage();
        const errorRate = this.metrics.errors / Math.max(1, this.metrics.totalRequests);

        const report = {
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime / 1000), // seconds
            memory: {
                current: {
                    rss: Math.round(currentMemory.rss / 1024 / 1024),
                    heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024)
                },
                peak: this.metrics.peakMemoryUsage,
                averageGrowth: this.getAverageMemoryGrowth()
            },
            requests: {
                total: this.metrics.totalRequests,
                errors: this.metrics.errors,
                errorRate: Math.round(errorRate * 100 * 100) / 100, // Round to 2 decimals
                averageResponseTime: Math.round(this.metrics.averageResponseTime)
            },
            activeGenerations: this.metrics.activeGenerations,
            thresholds: this.thresholds,
            status: this.determineSystemStatus()
        };

        this.emit('report', report);
        return report;
    }

    /**
     * Calculate average memory growth rate
     */
    getAverageMemoryGrowth() {
        if (this.metrics.memoryUsage.length < 2) {
            return 0;
        }

        const recent = this.metrics.memoryUsage.slice(-20); // Last 20 measurements
        const trend = this.calculateMemoryTrend(recent);
        return Math.round(trend.growthRate * 100) / 100;
    }

    /**
     * Determine overall system status
     */
    determineSystemStatus() {
        const currentMemory = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const errorRate = this.metrics.errors / Math.max(1, this.metrics.totalRequests);

        if (currentMemory > this.thresholds.maxMemoryMB || 
            errorRate > this.thresholds.maxErrorRate ||
            this.metrics.activeGenerations > this.thresholds.maxActiveGenerations) {
            return 'critical';
        }

        if (currentMemory > this.thresholds.maxMemoryMB * 0.8 || 
            errorRate > this.thresholds.maxErrorRate * 0.5 ||
            this.metrics.activeGenerations > this.thresholds.maxActiveGenerations * 0.8) {
            return 'warning';
        }

        return 'healthy';
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        const currentMemory = process.memoryUsage();
        
        return {
            ...this.metrics,
            currentMemory: {
                rss: Math.round(currentMemory.rss / 1024 / 1024),
                heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
                heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024)
            },
            uptime: Date.now() - this.metrics.startTime,
            status: this.determineSystemStatus()
        };
    }

    /**
     * Reset metrics (useful for testing)
     */
    resetMetrics() {
        this.metrics = {
            memoryUsage: [],
            activeGenerations: 0,
            totalRequests: 0,
            errors: 0,
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            startTime: Date.now()
        };
    }

    /**
     * Update performance thresholds
     */
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        console.log('🔧 Performance thresholds updated:', this.thresholds);
    }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Set up event listeners for monitoring
performanceMonitor.on('warning', (data) => {
    console.warn('⚠️ Performance Warning:', data.message);
});

performanceMonitor.on('alert', (data) => {
    console.error('🚨 Performance Alert:', data.message);
    // In production, this could send alerts to monitoring systems
});

performanceMonitor.on('report', (report) => {
    console.log('📊 Performance Report:', {
        status: report.status,
        memory: `${report.memory.current.rss}MB (peak: ${report.memory.peak}MB)`,
        requests: `${report.requests.total} total, ${report.requests.errors} errors (${report.requests.errorRate}%)`,
        avgResponseTime: `${report.requests.averageResponseTime}ms`,
        activeGenerations: report.activeGenerations
    });
});

module.exports = {
    PerformanceMonitor,
    performanceMonitor
};