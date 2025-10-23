/**
 * @file Project context
 * @description React context for project state management
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as apiService from '../services/apiService';

// Initial state
const initialState = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  stats: null,
};

// Action types
const ActionTypes = {
  SET_PROJECTS: 'SET_PROJECTS',
  SET_SELECTED_PROJECT: 'SET_SELECTED_PROJECT',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  REMOVE_PROJECT: 'REMOVE_PROJECT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_STATS: 'SET_STATS',
};

// Reducer
function projectReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_PROJECTS:
      return {
        ...state,
        projects: action.payload,
        loading: false,
      };
    
    case ActionTypes.SET_SELECTED_PROJECT:
      return {
        ...state,
        selectedProject: action.payload,
      };
    
    case ActionTypes.ADD_PROJECT:
      return {
        ...state,
        projects: [...state.projects, action.payload],
        selectedProject: action.payload,
        loading: false,
      };
    
    case ActionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        selectedProject: state.selectedProject?.id === action.payload.id
          ? action.payload
          : state.selectedProject,
        loading: false,
      };
    
    case ActionTypes.REMOVE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload
          ? null
          : state.selectedProject,
        loading: false,
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case ActionTypes.SET_STATS:
      return {
        ...state,
        stats: action.payload,
      };
    
    default:
      return state;
  }
}

// Create context
const ProjectContext = createContext();

// Provider component
export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Action creators
  const setProjects = (projects) => {
    dispatch({ type: ActionTypes.SET_PROJECTS, payload: projects });
  };

  const setSelectedProject = (project) => {
    dispatch({ type: ActionTypes.SET_SELECTED_PROJECT, payload: project });
  };

  const addProject = (project) => {
    dispatch({ type: ActionTypes.ADD_PROJECT, payload: project });
  };

  const updateProject = (project) => {
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: project });
  };

  const removeProject = (projectId) => {
    dispatch({ type: ActionTypes.REMOVE_PROJECT, payload: projectId });
  };

  const setLoading = (loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const setStats = (stats) => {
    dispatch({ type: ActionTypes.SET_STATS, payload: stats });
  };

  // Effects
  useEffect(() => {
    fetchProjects();
  }, []);

  // API methods
  const fetchProjects = async () => {
    try {
      setLoading(true);
      clearError();
      
      const projects = await apiService.fetchProjects();
      setProjects(projects);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name, framework) => {
    try {
      setLoading(true);
      clearError();
      
      const project = await apiService.createProject(name, framework);
      addProject(project);
      return project;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProjectContext = async (projectId, sourceContext) => {
    try {
      setLoading(true);
      clearError();
      
      const project = await apiService.updateProject(projectId, { sourceContext });
      updateProject(project);
      return project;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateGeneratedContent = async (projectId, content, metadata) => {
    try {
      setLoading(true);
      clearError();
      
      const project = await apiService.updateProject(projectId, {
        generatedContent: content,
        generationMetadata: metadata,
      });
      updateProject(project);
      return project;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      clearError();
      
      await apiService.deleteProject(projectId);
      removeProject(projectId);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const stats = await apiService.fetchProjectStats();
      setStats(stats);
      return stats;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    // Actions
    setProjects,
    setSelectedProject,
    addProject,
    updateProject,
    removeProject,
    setLoading,
    setError,
    clearError,
    setStats,
    // API methods
    fetchProjects,
    createProject,
    updateProjectContext,
    updateGeneratedContent,
    deleteProject,
    fetchProjectStats,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook to use project context
export function useProject() {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  
  return context;
}