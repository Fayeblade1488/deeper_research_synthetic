/**
 * @file Custom hooks for API interactions
 * @description React hooks for common API operations
 */

import { useState, useCallback, useRef } from 'react';
import * as apiService from '../services/apiService';

/**
 * Custom hook for project management
 * @returns {Object} Project management functions and state
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.fetchProjects();
      setProjects(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name, framework) => {
    try {
      setLoading(true);
      setError(null);
      
      const project = await apiService.createProject(name, framework);
      setProjects(prev => [...prev, project]);
      return project;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const project = await apiService.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? project : p));
      return project;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * Custom hook for content generation
 * @returns {Object} Generation functions and state
 */
export function useGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const eventSourceRef = useRef(null);

  const generateContent = useCallback((project, onProgress, onComplete, onError) => {
    try {
      setIsGenerating(true);
      setProgress(null);
      setGenerationError(null);
      
      // Start generation with SSE
      const cleanup = apiService.startGeneration(
        project,
        (progress) => {
          setProgress(progress);
          if (onProgress) onProgress(progress);
        },
        (result) => {
          setIsGenerating(false);
          setProgress(null);
          if (onComplete) onComplete(result);
        },
        (error) => {
          setIsGenerating(false);
          setProgress(null);
          setGenerationError(error);
          if (onError) onError(error);
        }
      );
      
      // Store cleanup function
      return cleanup;
    } catch (error) {
      setIsGenerating(false);
      setProgress(null);
      setGenerationError(error.message);
      if (onError) onError(error);
      throw error;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
    setProgress(null);
    setGenerationError(null);
  }, []);

  return {
    isGenerating,
    progress,
    error: generationError,
    generateContent,
    cancelGeneration,
  };
}

/**
 * Custom hook for health checks
 * @returns {Object} Health check functions and state
 */
export function useHealth() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      setHealthError(null);
      
      const data = await apiService.checkServerStatus();
      setHealth(data);
      return data;
    } catch (err) {
      setHealthError(err.message);
      throw err;
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async () => {
    try {
      setHealthLoading(true);
      setHealthError(null);
      
      const data = await apiService.fetchPerformanceMetrics();
      setMetrics(data);
      return data;
    } catch (err) {
      setHealthError(err.message);
      throw err;
    } finally {
      setHealthLoading(false);
    }
  }, []);

  return {
    health,
    metrics,
    loading: healthLoading,
    error: healthError,
    checkHealth,
    getMetrics,
  };
}