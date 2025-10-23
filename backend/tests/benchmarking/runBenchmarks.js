/**
 * @file Performance benchmarking script
 * @description Script for benchmarking key application operations
 */

const { performanceMonitor } = require('../services/performanceService');
const PerformanceBenchmark = require('./PerformanceBenchmark');
const Project = require('../data/models/Project');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock environment for benchmarking
let mongoServer;

/**
 * Initialize benchmarking environment
 */
async function initializeEnvironment() {
  console.log('Initializing benchmarking environment...');
  
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('Benchmarking environment initialized');
}

/**
 * Clean up benchmarking environment
 */
async function cleanupEnvironment() {
  console.log('Cleaning up benchmarking environment...');
  
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('Benchmarking environment cleaned up');
}

/**
 * Benchmark project creation performance
 */
async function benchmarkProjectCreation() {
  console.log('Benchmarking project creation...');
  
  const results = await PerformanceBenchmark.benchmarkIterations(
    'project-creation',
    async () => {
      const project = new Project({
        name: `Benchmark Project ${Date.now()}`,
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'This is test source context for benchmarking project creation performance.',
      });
      
      return await project.save();
    },
    100 // 100 iterations
  );
  
  console.log(`Project creation benchmark completed: ${results.iterations.successful}/${results.iterations.total} successful`);
  console.log(`Average duration: ${results.duration.toFixed(2)}ms`);
  console.log(`Success rate: ${(results.iterations.successRate * 100).toFixed(2)}%`);
  
  return results;
}

/**
 * Benchmark project retrieval performance
 */
async function benchmarkProjectRetrieval() {
  console.log('Benchmarking project retrieval...');
  
  // Create test projects first
  const testProjects = [];
  for (let i = 0; i < 50; i++) {
    const project = new Project({
      name: `Retrieval Test Project ${i}`,
      framework: 'PROJECT_DEEPDIVE',
      sourceContext: `Test source context ${i} for benchmarking project retrieval performance.`,
    });
    const savedProject = await project.save();
    testProjects.push(savedProject);
  }
  
  const results = await PerformanceBenchmark.benchmarkIterations(
    'project-retrieval',
    async () => {
      // Randomly select a project to retrieve
      const randomIndex = Math.floor(Math.random() * testProjects.length);
      const projectId = testProjects[randomIndex]._id;
      
      return await Project.findByIdActive(projectId);
    },
    100 // 100 iterations
  );
  
  console.log(`Project retrieval benchmark completed: ${results.iterations.successful}/${results.iterations.total} successful`);
  console.log(`Average duration: ${results.duration.toFixed(2)}ms`);
  console.log(`Success rate: ${(results.iterations.successRate * 100).toFixed(2)}%`);
  
  return results;
}

/**
 * Benchmark project update performance
 */
async function benchmarkProjectUpdate() {
  console.log('Benchmarking project update...');
  
  // Create test projects first
  const testProjects = [];
  for (let i = 0; i < 50; i++) {
    const project = new Project({
      name: `Update Test Project ${i}`,
      framework: 'PROJECT_DEEPDIVE',
      sourceContext: `Original source context ${i} for benchmarking project update performance.`,
    });
    const savedProject = await project.save();
    testProjects.push(savedProject);
  }
  
  const results = await PerformanceBenchmark.benchmarkIterations(
    'project-update',
    async () => {
      // Randomly select a project to update
      const randomIndex = Math.floor(Math.random() * testProjects.length);
      const project = testProjects[randomIndex];
      
      project.sourceContext = `Updated source context ${Date.now()} for benchmarking project update performance.`;
      return await project.save();
    },
    100 // 100 iterations
  );
  
  console.log(`Project update benchmark completed: ${results.iterations.successful}/${results.iterations.total} successful`);
  console.log(`Average duration: ${results.duration.toFixed(2)}ms`);
  console.log(`Success rate: ${(results.iterations.successRate * 100).toFixed(2)}%`);
  
  return results;
}

/**
 * Benchmark project deletion performance
 */
async function benchmarkProjectDeletion() {
  console.log('Benchmarking project deletion...');
  
  const results = await PerformanceBenchmark.benchmarkIterations(
    'project-deletion',
    async () => {
      const project = new Project({
        name: `Deletion Test Project ${Date.now()}`,
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context for benchmarking project deletion performance.',
      });
      const savedProject = await project.save();
      
      return await savedProject.softDelete();
    },
    100 // 100 iterations
  );
  
  console.log(`Project deletion benchmark completed: ${results.iterations.successful}/${results.iterations.total} successful`);
  console.log(`Average duration: ${results.duration.toFixed(2)}ms`);
  console.log(`Success rate: ${(results.iterations.successRate * 100).toFixed(2)}%`);
  
  return results;
}

/**
 * Benchmark memory usage patterns
 */
async function benchmarkMemoryUsage() {
  console.log('Benchmarking memory usage...');
  
  // Create a large number of projects to measure memory growth
  const results = await PerformanceBenchmark.benchmark(
    'memory-usage',
    async () => {
      const initialMemory = process.memoryUsage();
      
      // Create 1000 projects
      const projects = [];
      for (let i = 0; i < 1000; i++) {
        const project = new Project({
          name: `Memory Test Project ${i}`,
          framework: 'PROJECT_DEEPDIVE',
          sourceContext: `Test source context ${i} for benchmarking memory usage patterns with a longer string to consume more memory.`.repeat(10),
        });
        const savedProject = await project.save();
        projects.push(savedProject);
      }
      
      const finalMemory = process.memoryUsage();
      
      return {
        initialMemory: {
          rss: Math.round(initialMemory.rss / 1024 / 1024),
          heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024),
        },
        finalMemory: {
          rss: Math.round(finalMemory.rss / 1024 / 1024),
          heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
        },
        memoryGrowth: {
          rss: Math.round((finalMemory.rss - initialMemory.rss) / 1024 / 1024),
          heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
          heapTotal: Math.round((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024),
        },
        projectCount: projects.length,
      };
    }
  );
  
  console.log(`Memory usage benchmark completed: ${results.result.projectCount} projects created`);
  console.log(`Memory growth: ${results.result.memoryGrowth.rss}MB RSS, ${results.result.memoryGrowth.heapUsed}MB heapUsed`);
  
  return results;
}

/**
 * Benchmark performance monitor metrics collection
 */
async function benchmarkPerformanceMonitor() {
  console.log('Benchmarking performance monitor...');
  
  const results = await PerformanceBenchmark.benchmarkIterations(
    'performance-monitor',
    async () => {
      return performanceMonitor.getMetrics();
    },
    1000 // 1000 iterations
  );
  
  console.log(`Performance monitor benchmark completed: ${results.iterations.successful}/${results.iterations.total} successful`);
  console.log(`Average duration: ${results.duration.toFixed(2)}ms`);
  console.log(`Success rate: ${(results.iterations.successRate * 100).toFixed(2)}%`);
  
  return results;
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  console.log('Starting comprehensive performance benchmarking...\n');
  
  try {
    // Initialize environment
    await initializeEnvironment();
    
    // Run benchmarks
    const benchmarks = [
      { name: 'Project Creation', fn: benchmarkProjectCreation },
      { name: 'Project Retrieval', fn: benchmarkProjectRetrieval },
      { name: 'Project Update', fn: benchmarkProjectUpdate },
      { name: 'Project Deletion', fn: benchmarkProjectDeletion },
      { name: 'Memory Usage', fn: benchmarkMemoryUsage },
      { name: 'Performance Monitor', fn: benchmarkPerformanceMonitor },
    ];
    
    const results = [];
    
    for (const benchmark of benchmarks) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Running ${benchmark.name} Benchmark`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        const result = await benchmark.fn();
        results.push({ name: benchmark.name, result });
      } catch (error) {
        console.error(`Error running ${benchmark.name} benchmark:`, error.message);
        results.push({ name: benchmark.name, error: error.message });
      }
    }
    
    // Generate and display final report
    console.log(`\n${'='.repeat(50)}`);
    console.log('Benchmarking Complete');
    console.log(`${'='.repeat(50)}`);
    
    const report = PerformanceBenchmark.generateReport();
    console.log(JSON.stringify(report, null, 2));
    
    // Export results
    const jsonReport = PerformanceBenchmark.exportToJson();
    console.log('\nJSON Report:');
    console.log(jsonReport);
    
    const csvReport = PerformanceBenchmark.exportToCsv();
    console.log('\nCSV Report:');
    console.log(csvReport);
    
    return results;
  } catch (error) {
    console.error('Benchmarking failed:', error.message);
    throw error;
  } finally {
    // Clean up environment
    await cleanupEnvironment();
  }
}

// Run benchmarks if script is executed directly
if (require.main === module) {
  runAllBenchmarks()
    .then(() => {
      console.log('\nAll benchmarks completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Benchmarking failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runAllBenchmarks,
  benchmarkProjectCreation,
  benchmarkProjectRetrieval,
  benchmarkProjectUpdate,
  benchmarkProjectDeletion,
  benchmarkMemoryUsage,
  benchmarkPerformanceMonitor,
};