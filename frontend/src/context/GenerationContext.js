/**
 * @file Generation context
 * @description React context for content generation state management
 */

import React, { createContext, useContext, useReducer, useRef } from 'react';
import * as apiService from '../services/apiService';

// Initial state
const initialState = {
  isGenerating: false,
  progress: null,
  error: null,
  activeGeneration: null,
};

// Action types
const ActionTypes = {
  START_GENERATION: 'START_GENERATION',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  COMPLETE_GENERATION: 'COMPLETE_GENERATION',
  CANCEL_GENERATION: 'CANCEL_GENERATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_ACTIVE_GENERATION: 'SET_ACTIVE_GENERATION',
};

// Reducer
function generationReducer(state, action) {
  switch (action.type) {
    case ActionTypes.START_GENERATION:
      return {
        ...state,
        isGenerating: true,
        progress: null,
        error: null,
      };
    
    case ActionTypes.UPDATE_PROGRESS:
      return {
        ...state,
        progress: action.payload,
      };
    
    case ActionTypes.COMPLETE_GENERATION:
      return {
        ...state,
        isGenerating: false,
        progress: null,
      };
    
    case ActionTypes.CANCEL_GENERATION:
      return {
        ...state,
        isGenerating: false,
        progress: null,
        error: null,
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        isGenerating: false,
        progress: null,
        error: action.payload,
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case ActionTypes.SET_ACTIVE_GENERATION:
      return {
        ...state,
        activeGeneration: action.payload,
      };
    
    default:
      return state;
  }
}

// Create context
const GenerationContext = createContext();

// Provider component
export function GenerationProvider({ children }) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  const cleanupRef = useRef(null);

  // Action creators
  const startGeneration = () => {
    dispatch({ type: ActionTypes.START_GENERATION });
  };

  const updateProgress = (progress) => {
    dispatch({ type: ActionTypes.UPDATE_PROGRESS, payload: progress });
  };

  const completeGeneration = () => {
    dispatch({ type: ActionTypes.COMPLETE_GENERATION });
  };

  const cancelGeneration = () => {
    // Cleanup any active streams
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    dispatch({ type: ActionTypes.CANCEL_GENERATION });
  };

  const setError = (error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const setActiveGeneration = (generation) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_GENERATION, payload: generation });
  };

  // Generation methods
  const generateContent = async (project, onProgress, onComplete, onError) => {
    try {
      startGeneration();
      clearError();
      
      // Start generation with cleanup reference
      const cleanup = apiService.startGeneration(
        project,
        (progress) => {
          updateProgress(progress);
          if (onProgress) onProgress(progress);
        },
        (result) => {
          completeGeneration();
          if (onComplete) onComplete(result);
        },
        (error) => {
          setError(error);
          if (onError) onError(error);
        }
      );
      
      // Store cleanup function
      cleanupRef.current = cleanup;
      
      // Store active generation info
      setActiveGeneration({
        projectId: project.id,
        startTime: Date.now(),
      });
      
      return cleanup;
    } catch (error) {
      setError(error.message);
      if (onError) onError(error);
      throw error;
    }
  };

  const checkGenerationStatus = async (projectId) => {
    try {
      const status = await apiService.checkGenerationStatus(projectId);
      return status;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const cancelActiveGeneration = async (projectId) => {
    try {
      // Cancel on backend
      await apiService.cancelGeneration(projectId);
      
      // Cancel locally
      cancelGeneration();
      
      // Clear active generation
      setActiveGeneration(null);
      
      return { success: true, message: 'Generation cancelled' };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    // Actions
    startGeneration,
    updateProgress,
    completeGeneration,
    cancelGeneration,
    setError,
    clearError,
    setActiveGeneration,
    // Generation methods
    generateContent,
    checkGenerationStatus,
    cancelActiveGeneration,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

// Hook to use generation context
export function useGeneration() {
  const context = useContext(GenerationContext);
  
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  
  return context;
}