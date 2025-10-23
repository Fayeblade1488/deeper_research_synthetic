/**
 * @file Health check controller
 * @description REST API controller for health check endpoints
 */

const { performanceMonitor } = require('../../services/performanceService');
const { config } = require('../../config');
const logger = require('../../utils/logger');

/**
 * Health check controller class
 * Handles HTTP requests for health check endpoints
 */
class HealthController {
  /**
   * Get server health status
   * GET /api/v1/health
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getHealth(req, res, next) {
    try {
      logger.info('Health check requested');
      
      // Get performance metrics
      const perfMetrics = await performanceMonitor.getMetricsAsync();
      
      // Check AI provider configuration
      let aiProviderInfo = "Not configured";
      try {
        const ProviderFactory = require("../../services/providers/ProviderFactory");
        const provider = ProviderFactory.createFromEnv();
        const info = provider.getInfo();
        aiProviderInfo = `${info.name} (${
          info.privacyFocused ? "🔒 Privacy-First" : "Standard"
        })`;
      } catch (error) {
        aiProviderInfo = `Error: ${error.message}`;
      }
      
      // System health status
      const systemStatus = perfMetrics.status;
      
      res.json({
        success: true,
        data: {
          status: "THE FORGE is operational",
          phase: "Operation COGNITION",
          systemStatus,
          timestamp: new Date().toISOString(),
          uptime: Math.round(perfMetrics.uptime / 1000), // seconds
          aiProvider: aiProviderInfo,
          config: {
            server: {
              port: config.server.port,
              host: config.server.host,
              nodeEnv: config.server.nodeEnv,
            },
            ai: {
              provider: config.ai.provider,
              temperature: config.ai.temperature,
              maxTokens: config.ai.maxTokens,
            },
          },
          performance: {
            memory: {
              rss: perfMetrics.currentMemory.rss,
              heapUsed: perfMetrics.currentMemory.heapUsed,
              heapTotal: perfMetrics.currentMemory.heapTotal,
            },
            activeGenerations: perfMetrics.activeGenerations,
            totalRequests: perfMetrics.totalRequests,
            errors: perfMetrics.errors,
            errorRate: perfMetrics.errors / Math.max(1, perfMetrics.totalRequests),
          },
        }
      });
    } catch (error) {
      logger.error('Error in health check', { error: error.message });
      next(error);
    }
  }

  /**
   * Get server performance metrics
   * GET /api/v1/health/metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getMetrics(req, res, next) {
    try {
      logger.info('Performance metrics requested');
      
      const metrics = await performanceMonitor.getMetricsAsync();
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error in performance metrics', { error: error.message });
      next(error);
    }
  }

  /**
   * Generate performance report
   * POST /api/v1/health/report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async generateReport(req, res, next) {
    try {
      logger.info('Performance report requested');
      
      const report = performanceMonitor.generatePerformanceReport();
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error in performance report', { error: error.message });
      next(error);
    }
  }

  /**
   * Update performance thresholds
   * PUT /api/v1/health/thresholds
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateThresholds(req, res, next) {
    try {
      const newThresholds = req.body;
      
      logger.info('Updating performance thresholds', { newThresholds });
      
      performanceMonitor.updateThresholds(newThresholds);
      
      res.json({
        success: true,
        message: "Performance thresholds updated",
        data: {
          thresholds: performanceMonitor.thresholds,
        }
      });
    } catch (error) {
      logger.error('Error updating performance thresholds', { error: error.message });
      next(error);
    }
  }
}

// Export singleton instance
module.exports = new HealthController();