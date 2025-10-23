/**
 * @file Generation context unit tests
 * @description Unit tests for the GenerationContext React context
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GenerationProvider, useGeneration } from '../../../src/context/GenerationContext';
import * as apiService from '../../../src/services/apiService';

// Mock the apiService
jest.mock('../../../src/services/apiService');

// Create a wrapper component for testing
const wrapper = ({ children }) => (
  <GenerationProvider>{children}</GenerationProvider>
);

describe('GenerationContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('useGeneration hook', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useGeneration(), { wrapper });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.activeGeneration).toBeNull();
    });

    it('should start generation successfully', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const mockCleanup = jest.fn();
      apiService.startGeneration.mockReturnValue(mockCleanup);

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      let cleanup;
      await act(async () => {
        cleanup = await result.current.startGeneration(mockProject);
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.activeGeneration).toEqual({
        projectId: '1',
        startTime: expect.any(Number),
      });
      expect(cleanup).toBe(mockCleanup);
      expect(apiService.startGeneration).toHaveBeenCalledWith(
        mockProject,
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should handle start generation error', async () => {
      const errorMessage = 'Failed to start generation';
      apiService.startGeneration.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Try to start generation
      await act(async () => {
        try {
          await result.current.startGeneration(mockProject);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.activeGeneration).toBeNull();
    });

    it('should update progress during generation', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const mockCleanup = jest.fn();
      apiService.startGeneration.mockImplementation((project, onProgress) => {
        // Simulate progress updates
        setTimeout(() => {
          onProgress({ type: 'progress', wordCount: 100, chunkCount: 5 });
        }, 0);
        
        setTimeout(() => {
          onProgress({ type: 'progress', wordCount: 200, chunkCount: 10 });
        }, 10);
        
        return mockCleanup;
      });

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      await act(async () => {
        await result.current.startGeneration(mockProject);
      });

      // Wait for progress updates
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.progress).toEqual({
        type: 'progress',
        wordCount: 200,
        chunkCount: 10,
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle generation completion', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const mockResult = {
        content: 'Generated content',
        metadata: { wordCount: 100 },
      };

      const mockCleanup = jest.fn();
      apiService.startGeneration.mockImplementation((project, onProgress, onComplete) => {
        // Simulate completion
        setTimeout(() => {
          onComplete(mockResult);
        }, 0);
        
        return mockCleanup;
      });

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      await act(async () => {
        await result.current.startGeneration(mockProject);
      });

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.activeGeneration).toBeNull();
    });

    it('should handle generation errors', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const errorMessage = 'Generation failed';
      const mockCleanup = jest.fn();
      apiService.startGeneration.mockImplementation((project, onProgress, onComplete, onError) => {
        // Simulate error
        setTimeout(() => {
          onError(new Error(errorMessage));
        }, 0);
        
        return mockCleanup;
      });

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      await act(async () => {
        await result.current.startGeneration(mockProject);
      });

      // Wait for error
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.activeGeneration).toBeNull();
    });

    it('should cancel generation successfully', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const mockCleanup = jest.fn();
      apiService.startGeneration.mockReturnValue(mockCleanup);
      apiService.cancelGeneration.mockResolvedValue({ success: true, message: 'Generation cancelled' });

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      await act(async () => {
        await result.current.startGeneration(mockProject);
      });

      // Cancel generation
      await act(async () => {
        await result.current.cancelGeneration('1');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.activeGeneration).toBeNull();
      expect(mockCleanup).toHaveBeenCalled();
      expect(apiService.cancelGeneration).toHaveBeenCalledWith('1');
    });

    it('should handle cancel generation error', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const errorMessage = 'Failed to cancel generation';
      const mockCleanup = jest.fn();
      apiService.startGeneration.mockReturnValue(mockCleanup);
      apiService.cancelGeneration.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Start generation
      await act(async () => {
        await result.current.startGeneration(mockProject);
      });

      // Try to cancel generation
      await act(async () => {
        try {
          await result.current.cancelGeneration('1');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.activeGeneration).toBeNull();
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should check generation status successfully', async () => {
      const mockStatus = { active: true, status: 'running' };
      apiService.checkGenerationStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Check generation status
      let status;
      await act(async () => {
        status = await result.current.checkGenerationStatus('1');
      });

      expect(status).toEqual(mockStatus);
      expect(apiService.checkGenerationStatus).toHaveBeenCalledWith('1');
    });

    it('should handle check generation status error', async () => {
      const errorMessage = 'Failed to check status';
      apiService.checkGenerationStatus.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Try to check generation status
      await act(async () => {
        try {
          await result.current.checkGenerationStatus('1');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear error', async () => {
      const errorMessage = 'Test error';
      apiService.startGeneration.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const mockProject = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test source context',
      };

      const { result } = renderHook(() => useGeneration(), { wrapper });

      // Try to start generation to create error
      await act(async () => {
        try {
          await result.current.startGeneration(mockProject);
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe(errorMessage);

      // Clear error
      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set active generation', async () => {
      const { result } = renderHook(() => useGeneration(), { wrapper });

      const mockGeneration = {
        projectId: '1',
        startTime: Date.now(),
      };

      // Set active generation
      await act(async () => {
        result.current.setActiveGeneration(mockGeneration);
      });

      expect(result.current.activeGeneration).toEqual(mockGeneration);
    });
  });
});