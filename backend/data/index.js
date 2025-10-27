/**
 * @file Database connection utility
 * @description Centralized database connection management
 */

const mongoose = require('mongoose');
const { config } = require('../config');
const logger = require('../utils/logger');

/**
 * Database connection class
 */
class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to database with retry logic
   * @param {number} maxRetries - Maximum number of connection attempts (default: 3)
   * @returns {Promise<void>}
   */
  async connect(maxRetries = 3) {
    if (this.isConnected) {
      logger.info('Already connected to database');
      return;
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Connecting to database (attempt ${attempt}/${maxRetries})`, {
          url: config.database.url
        });
        
        // Configure mongoose
        mongoose.set('strictQuery', false);
        
        // Connect to database
        this.connection = await mongoose.connect(config.database.url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          w: 'majority',
        });

        // Validate connection is working
        await mongoose.connection.db.admin().ping();
        
        this.isConnected = true;
        logger.info('Connected to database successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
          logger.error('Database connection error', { error: err.message });
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('Database disconnected');
          this.isConnected = false;
        });

        // Handle process termination
        process.on('SIGINT', async () => {
          await this.disconnect();
          process.exit(0);
        });

        return; // Success, exit the retry loop
      } catch (error) {
        lastError = error;
        logger.warn(`Database connection attempt ${attempt} failed`, {
          error: error.message,
          retriesLeft: maxRetries - attempt
        });

        if (attempt < maxRetries) {
          // Wait before retrying with exponential backoff
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          logger.info(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries exhausted
    const errorMsg = `Failed to connect to database after ${maxRetries} attempts: ${lastError?.message}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Disconnect from database
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.isConnected) {
      logger.info('No active database connection to disconnect');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from database successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getStatus() {
    return this.isConnected;
  }

  /**
   * Get database connection
   * @returns {Object|null} Database connection object or null if not connected
   */
  getConnection() {
    return this.connection;
  }
}

// Export singleton instance
module.exports = new DatabaseConnection();