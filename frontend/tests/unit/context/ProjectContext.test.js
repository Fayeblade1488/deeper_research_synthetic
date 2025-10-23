/**
 * @file Project context unit tests
 * @description Unit tests for the ProjectContext React context
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProject } from '../../../src/context/ProjectContext';

// Mock the API service
jest.mock('../../../src/services/apiService', () => ({
  fetchProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  fetchProjectStats: jest.fn(),
}));

describe('ProjectContext', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Project 1',
      framework: 'PROJECT_DEEPDIVE',
      sourceContext: '',
      generatedContent: '',
      generationMetadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'New',
      version: 0,
    },
    {
      id: '2',
      name: 'Project 2',
      framework: 'PROJECT_SYNTHETIC',
      sourceContext: '',
      generatedContent: '',
      generationMetadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'New',
      version: 0,
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock API service functions
    const apiService = require('../../../src/services/apiService');
    apiService.fetchProjects.mockResolvedValue(mockProjects);
    apiService.createProject.mockResolvedValue({
      ...mockProjects[0],
      id: '3',
      name: 'New Project',
    });
    apiService.updateProject.mockResolvedValue({
      ...mockProjects[0],
      name: 'Updated Project',
      version: 1,
    });
    apiService.deleteProject.mockResolvedValue();
    apiService.fetchProjectStats.mockResolvedValue({
      total: 2,
      byFramework: {
        'PROJECT_DEEPDIVE': 1,
        'PROJECT_SYNTHETIC': 1,
      },
      byStatus: {
        'New': 2,
      },
    });
  });

  // Create a wrapper component for testing
  const wrapper = ({ children }) => (
    <ProjectProvider>{children}</ProjectProvider>
  );

  describe('useProject hook', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.projects).toEqual([]);
      expect(result.current.selectedProject).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toBeNull();
    });

    it('should fetch projects on mount', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.loading).toBe(false);
      expect(require('../../../src/services/apiService').fetchProjects).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch projects error', async () => {
      const errorMessage = 'Failed to fetch projects';
      const apiService = require('../../../src/services/apiService');
      apiService.fetchProjects.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should create project successfully', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Create new project
      let newProject;
      await act(async () => {
        newProject = await result.current.createProject('New Project', 'PROJECT_DEEPDIVE');
      });

      expect(newProject).toEqual({
        ...mockProjects[0],
        id: '3',
        name: 'New Project',
      });
      
      expect(result.current.projects).toEqual([
        ...mockProjects,
        {
          ...mockProjects[0],
          id: '3',
          name: 'New Project',
        },
      ]);
      
      expect(result.current.selectedProject).toEqual({
        ...mockProjects[0],
        id: '3',
        name: 'New Project',
      });
      
      expect(require('../../../src/services/apiService').createProject).toHaveBeenCalledWith(
        'New Project',
        'PROJECT_DEEPDIVE'
      );
    });

    it('should handle create project error', async () => {
      const errorMessage = 'Failed to create project';
      const apiService = require('../../../src/services/apiService');
      apiService.createProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to create project
      await expect(
        act(async () => {
          await result.current.createProject('New Project', 'PROJECT_DEEPDIVE');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.projects).toEqual(mockProjects);
    });

    it('should update project context successfully', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Update project context
      let updatedProject;
      await act(async () => {
        updatedProject = await result.current.updateProjectContext('1', 'Updated context');
      });

      expect(updatedProject).toEqual({
        ...mockProjects[0],
        name: 'Updated Project',
        version: 1,
      });
      
      expect(result.current.projects).toEqual([
        {
          ...mockProjects[0],
          name: 'Updated Project',
          version: 1,
        },
        mockProjects[1],
      ]);
      
      expect(result.current.selectedProject).toEqual({
        ...mockProjects[0],
        name: 'Updated Project',
        version: 1,
      });
      
      expect(require('../../../src/services/apiService').updateProject).toHaveBeenCalledWith(
        '1',
        { sourceContext: 'Updated context' }
      );
    });

    it('should handle update project context error', async () => {
      const errorMessage = 'Failed to update project';
      const apiService = require('../../../src/services/apiService');
      apiService.updateProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to update project context
      await expect(
        act(async () => {
          await result.current.updateProjectContext('1', 'Updated context');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
    });

    it('should update generated content successfully', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Update generated content
      const metadata = { wordCount: 100 };
      let updatedProject;
      await act(async () => {
        updatedProject = await result.current.updateGeneratedContent('1', 'Generated content', metadata);
      });

      expect(updatedProject).toEqual({
        ...mockProjects[0],
        name: 'Updated Project',
        version: 1,
      });
      
      expect(result.current.projects).toEqual([
        {
          ...mockProjects[0],
          name: 'Updated Project',
          version: 1,
        },
        mockProjects[1],
      ]);
      
      expect(result.current.selectedProject).toEqual({
        ...mockProjects[0],
        name: 'Updated Project',
        version: 1,
      });
      
      expect(require('../../../src/services/apiService').updateProject).toHaveBeenCalledWith(
        '1',
        {
          generatedContent: 'Generated content',
          generationMetadata: metadata,
        }
      );
    });

    it('should handle update generated content error', async () => {
      const errorMessage = 'Failed to update generated content';
      const apiService = require('../../../src/services/apiService');
      apiService.updateProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to update generated content
      await expect(
        act(async () => {
          await result.current.updateGeneratedContent('1', 'Generated content', { wordCount: 100 });
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
    });

    it('should delete project successfully', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Delete project
      await act(async () => {
        await result.current.deleteProject('1');
      });

      expect(result.current.projects).toEqual([mockProjects[1]]);
      expect(result.current.selectedProject).toBeNull();
      
      expect(require('../../../src/services/apiService').deleteProject).toHaveBeenCalledWith('1');
    });

    it('should handle delete project error', async () => {
      const errorMessage = 'Failed to delete project';
      const apiService = require('../../../src/services/apiService');
      apiService.deleteProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to delete project
      await expect(
        act(async () => {
          await result.current.deleteProject('1');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.projects).toEqual(mockProjects);
    });

    it('should fetch project stats successfully', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Fetch project stats
      let stats;
      await act(async () => {
        stats = await result.current.fetchProjectStats();
      });

      expect(stats).toEqual({
        total: 2,
        byFramework: {
          'PROJECT_DEEPDIVE': 1,
          'PROJECT_SYNTHETIC': 1,
        },
        byStatus: {
          'New': 2,
        },
      });
      
      expect(result.current.stats).toEqual(stats);
      
      expect(require('../../../src/services/apiService').fetchProjectStats).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch project stats error', async () => {
      const errorMessage = 'Failed to fetch project stats';
      const apiService = require('../../../src/services/apiService');
      apiService.fetchProjectStats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to fetch project stats
      await expect(
        act(async () => {
          await result.current.fetchProjectStats();
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.stats).toBeNull();
    });

    it('should set selected project', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set selected project
      act(() => {
        result.current.setSelectedProject(mockProjects[0]);
      });

      expect(result.current.selectedProject).toEqual(mockProjects[0]);
    });

    it('should clear error', async () => {
      const errorMessage = 'Test error';
      const apiService = require('../../../src/services/apiService');
      apiService.fetchProjects.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      // Wait for initial fetch to cause error
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(errorMessage);

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading state', async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Set loading to true
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      // Set loading to false
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });
});