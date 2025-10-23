/**
 * @file Framework service unit tests
 * @description Unit tests for the FrameworkService functions
 */

const fs = require('fs').promises;
const path = require('path');
const {
  getFrameworkMetadata,
  loadFrameworkPrompt,
  constructPrompt,
  isValidFramework,
} = require('../../../services/frameworkService');

// Mock file system operations
jest.mock('fs/promises');

describe('FrameworkService', () => {
  const FRAMEWORKS_PATH = path.join(__dirname, '../../../data/frameworks');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getFrameworkMetadata', () => {
    it('should return metadata for valid PROJECT_DEEPDIVE framework', () => {
      const metadata = getFrameworkMetadata('PROJECT_DEEPDIVE');

      expect(metadata).toEqual({
        name: 'PROJECT_DEEPDIVE',
        outputType: 'TOME',
        promptFile: 'research_frameworks/deeper_research_framework.txt',
        minWords: 10000,
        description: 'Exhaustive academic-style white paper',
      });
    });

    it('should return metadata for valid PROJECT_SYNTHETIC framework', () => {
      const metadata = getFrameworkMetadata('PROJECT_SYNTHETIC');

      expect(metadata).toEqual({
        name: 'PROJECT_SYNTHETIC',
        outputType: 'TRANSMISSION',
        promptFile: 'podcast_synthetics/podcast-synthetic-template.md',
        minWords: 15000,
        description: 'Narrative-driven podcast episode script',
      });
    });

    it('should return metadata for valid PROJECT_BENCHMARK framework', () => {
      const metadata = getFrameworkMetadata('PROJECT_BENCHMARK');

      expect(metadata).toEqual({
        name: 'PROJECT_BENCHMARK',
        outputType: 'SNAPSHOT',
        promptFile: 'benchmarks/human-condition-benchmark-framework.txt',
        minWords: 5000,
        description: 'Data-driven risk assessments with DEFCON ratings',
      });
    });

    it('should return null for invalid framework', () => {
      const metadata = getFrameworkMetadata('INVALID_FRAMEWORK');

      expect(metadata).toBeNull();
    });

    it('should return null for null framework', () => {
      const metadata = getFrameworkMetadata(null);

      expect(metadata).toBeNull();
    });

    it('should return null for undefined framework', () => {
      const metadata = getFrameworkMetadata(undefined);

      expect(metadata).toBeNull();
    });

    it('should handle case-insensitive framework names', () => {
      const metadata1 = getFrameworkMetadata('project_deepdive');
      const metadata2 = getFrameworkMetadata('PROJECT_DEEPDIVE');

      expect(metadata1).toEqual(metadata2);
    });
  });

  describe('isValidFramework', () => {
    it('should return true for valid frameworks', () => {
      expect(isValidFramework('PROJECT_DEEPDIVE')).toBe(true);
      expect(isValidFramework('PROJECT_SYNTHETIC')).toBe(true);
      expect(isValidFramework('PROJECT_BENCHMARK')).toBe(true);
    });

    it('should return false for invalid frameworks', () => {
      expect(isValidFramework('INVALID_FRAMEWORK')).toBe(false);
      expect(isValidFramework('')).toBe(false);
      expect(isValidFramework(null)).toBe(false);
      expect(isValidFramework(undefined)).toBe(false);
    });

    it('should handle case-insensitive validation', () => {
      expect(isValidFramework('project_deepdive')).toBe(true);
      expect(isValidFramework('PROJECT_deepdive')).toBe(true);
    });
  });

  describe('loadFrameworkPrompt', () => {
    it('should load prompt content for valid framework', async () => {
      const mockPromptContent = 'This is the framework prompt content';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const prompt = await loadFrameworkPrompt('PROJECT_DEEPDIVE');

      expect(prompt).toBe(mockPromptContent);
      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt'),
        'utf-8'
      );
    });

    it('should throw error for invalid framework type', async () => {
      await expect(loadFrameworkPrompt('INVALID_FRAMEWORK'))
        .rejects
        .toThrow('Unknown framework type: INVALID_FRAMEWORK');
    });

    it('should throw error for missing framework type', async () => {
      await expect(loadFrameworkPrompt(''))
        .rejects
        .toThrow('Invalid framework type: must be a non-empty string');

      await expect(loadFrameworkPrompt(null))
        .rejects
        .toThrow('Invalid framework type: must be a non-empty string');

      await expect(loadFrameworkPrompt(undefined))
        .rejects
        .toThrow('Invalid framework type: must be a non-empty string');
    });

    it('should throw error for missing prompt file configuration', async () => {
      // Mock framework metadata with missing prompt file
      const originalFrameworkTypes = require('../../../services/frameworkService').FRAMEWORK_TYPES;
      const mockFrameworkTypes = {
        ...originalFrameworkTypes,
        PROJECT_DEEPDIVE: {
          ...originalFrameworkTypes.PROJECT_DEEPDIVE,
          promptFile: null,
        },
      };

      // Temporarily override framework types
      jest.mock('../../../services/frameworkService', () => ({
        ...jest.requireActual('../../../services/frameworkService'),
        get FRAMEWORK_TYPES() {
          return mockFrameworkTypes;
        },
      }));

      // Re-import the module
      const { loadFrameworkPrompt } = require('../../../services/frameworkService');

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Invalid prompt file configuration for framework: PROJECT_DEEPDIVE');

      // Restore original framework types
      jest.resetModules();
    });

    it('should throw error for path traversal attempts', async () => {
      await expect(loadFrameworkPrompt('../etc/passwd'))
        .rejects
        .toThrow('Unknown framework type: ../etc/passwd');

      await expect(loadFrameworkPrompt('....//etc/passwd'))
        .rejects
        .toThrow('Unknown framework type: ....//etc/passwd');

      await expect(loadFrameworkPrompt('..\\etc\\passwd'))
        .rejects
        .toThrow('Unknown framework type: ..\\etc\\passwd');

      await expect(loadFrameworkPrompt('\0etc/passwd'))
        .rejects
        .toThrow('Invalid framework type: must be a non-empty string');
    });

    it('should throw error for absolute path attempts', async () => {
      await expect(loadFrameworkPrompt('/etc/passwd'))
        .rejects
        .toThrow('Unknown framework type: /etc/passwd');

      await expect(loadFrameworkPrompt('C:\\Windows\\System32'))
        .rejects
        .toThrow('Unknown framework type: C:\\Windows\\System32');
    });

    it('should throw error when file does not exist', async () => {
      fs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Failed to load framework prompt: ENOENT: no such file or directory');

      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
    });

    it('should throw error when file is not a regular file', async () => {
      fs.stat.mockResolvedValue({ isFile: () => false });

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Prompt path does not point to a valid file');

      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
    });

    it('should throw error when file is empty', async () => {
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue('');

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Prompt file appears to be empty or too short');

      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt'),
        'utf-8'
      );
    });

    it('should throw error when file is too short', async () => {
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue('A');

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Prompt file appears to be empty or too short');

      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt'),
        'utf-8'
      );
    });

    it('should handle file read errors', async () => {
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(loadFrameworkPrompt('PROJECT_DEEPDIVE'))
        .rejects
        .toThrow('Failed to load framework prompt: Permission denied');

      expect(fs.stat).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt')
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(FRAMEWORKS_PATH, 'research_frameworks/deeper_research_framework.txt'),
        'utf-8'
      );
    });
  });

  describe('constructPrompt', () => {
    it('should construct prompt with source context and user query', async () => {
      const mockPromptContent = '# Framework Prompt\n\nThis is the framework template.';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const frameworkType = 'PROJECT_DEEPDIVE';
      const sourceContext = 'This is the source context for generation.';
      const userQuery = 'Please focus on climate change impacts.';

      const prompt = await constructPrompt(frameworkType, sourceContext, userQuery);

      expect(prompt).toContain('# Framework Prompt');
      expect(prompt).toContain('This is the framework template.');
      expect(prompt).toContain('--- SOURCE CONTEXT ---');
      expect(prompt).toContain(sourceContext);
      expect(prompt).toContain('--- END SOURCE CONTEXT ---');
      expect(prompt).toContain('--- USER QUERY ---');
      expect(prompt).toContain(userQuery);
      expect(prompt).toContain('--- END USER QUERY ---');
    });

    it('should construct prompt with only source context', async () => {
      const mockPromptContent = '# Framework Prompt\n\nThis is the framework template.';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const frameworkType = 'PROJECT_DEEPDIVE';
      const sourceContext = 'This is the source context for generation.';
      const userQuery = '';

      const prompt = await constructPrompt(frameworkType, sourceContext, userQuery);

      expect(prompt).toContain('# Framework Prompt');
      expect(prompt).toContain('This is the framework template.');
      expect(prompt).toContain('--- SOURCE CONTEXT ---');
      expect(prompt).toContain(sourceContext);
      expect(prompt).toContain('--- END SOURCE CONTEXT ---');
      expect(prompt).toContain('--- USER QUERY ---');
      expect(prompt).toContain('Generate a comprehensive Exhaustive academic-style white paper based on the provided source context.');
      expect(prompt).toContain('--- END USER QUERY ---');
    });

    it('should construct prompt without source context', async () => {
      const mockPromptContent = '# Framework Prompt\n\nThis is the framework template.';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const frameworkType = 'PROJECT_DEEPDIVE';
      const sourceContext = '';
      const userQuery = 'Please generate a paper about renewable energy.';

      const prompt = await constructPrompt(frameworkType, sourceContext, userQuery);

      expect(prompt).toContain('# Framework Prompt');
      expect(prompt).toContain('This is the framework template.');
      expect(prompt).not.toContain('--- SOURCE CONTEXT ---');
      expect(prompt).toContain('--- USER QUERY ---');
      expect(prompt).toContain(userQuery);
      expect(prompt).toContain('--- END USER QUERY ---');
    });

    it('should handle empty source context gracefully', async () => {
      const mockPromptContent = '# Framework Prompt\n\nThis is the framework template.';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const frameworkType = 'PROJECT_DEEPDIVE';
      const sourceContext = null;
      const userQuery = 'Please generate a paper about renewable energy.';

      const prompt = await constructPrompt(frameworkType, sourceContext, userQuery);

      expect(prompt).toContain('# Framework Prompt');
      expect(prompt).toContain('This is the framework template.');
      expect(prompt).not.toContain('--- SOURCE CONTEXT ---');
      expect(prompt).toContain('--- USER QUERY ---');
      expect(prompt).toContain(userQuery);
      expect(prompt).toContain('--- END USER QUERY ---');
    });

    it('should handle invalid framework type', async () => {
      await expect(constructPrompt('INVALID_FRAMEWORK', 'Source context', 'User query'))
        .rejects
        .toThrow('Unknown framework type: INVALID_FRAMEWORK');
    });

    it('should handle missing framework type', async () => {
      await expect(constructPrompt('', 'Source context', 'User query'))
        .rejects
        .toThrow('Invalid framework type: must be a non-empty string');
    });

    it('should handle loadFrameworkPrompt errors', async () => {
      fs.stat.mockRejectedValue(new Error('File not found'));

      await expect(constructPrompt('PROJECT_DEEPDIVE', 'Source context', 'User query'))
        .rejects
        .toThrow('Failed to load framework prompt: File not found');
    });

    it('should construct different prompts for different frameworks', async () => {
      const mockPromptContent = '# Framework Prompt\n\nThis is the framework template.';
      fs.stat.mockResolvedValue({ isFile: () => true });
      fs.readFile.mockResolvedValue(mockPromptContent);

      const sourceContext = 'This is the source context.';
      const userQuery = 'Generate content based on this context.';

      // Test PROJECT_DEEPDIVE
      const deepdivePrompt = await constructPrompt('PROJECT_DEEPDIVE', sourceContext, userQuery);
      expect(deepdivePrompt).toContain('Exhaustive academic-style white paper');

      // Test PROJECT_SYNTHETIC
      const syntheticPrompt = await constructPrompt('PROJECT_SYNTHETIC', sourceContext, userQuery);
      expect(syntheticPrompt).toContain('Narrative-driven podcast episode script');

      // Test PROJECT_BENCHMARK
      const benchmarkPrompt = await constructPrompt('PROJECT_BENCHMARK', sourceContext, userQuery);
      expect(benchmarkPrompt).toContain('Data-driven risk assessments with DEFCON ratings');
    });
  });
});