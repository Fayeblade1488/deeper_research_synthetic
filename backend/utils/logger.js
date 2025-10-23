/**
 * @file Logger utility for the application
 * @description Centralized logging with configurable levels and formats
 */

const { config } = require('../config');

/**
 * Log levels
 */
const LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Current log level
 */
const currentLevel = LEVELS[config.logging.level.toUpperCase()] || LEVELS.INFO;

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase();
  
  if (config.logging.format === 'json') {
    return JSON.stringify({
      timestamp,
      level: levelStr,
      message,
      ...meta,
    });
  } else {
    // Simple format
    let log = `[${timestamp}] ${levelStr}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  }
}

/**
 * Logger class
 */
class Logger {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (currentLevel >= LEVELS.ERROR) {
      console.error(formatLog('error', message, meta));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (currentLevel >= LEVELS.WARN) {
      console.warn(formatLog('warn', message, meta));
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (currentLevel >= LEVELS.INFO) {
      console.info(formatLog('info', message, meta));
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (currentLevel >= LEVELS.DEBUG) {
      console.debug(formatLog('debug', message, meta));
    }
  }
}

// Export singleton instance
module.exports = new Logger();