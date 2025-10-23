/**
 * @file App component unit tests
 * @description Unit tests for the main App React component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../../src/App';

// Mock the child components
jest.mock('../../../src/components/Workspace', () => {
  return function MockWorkspace(props) {
    return <div data-testid="workspace">Workspace Component</div>;
  };
});

// Mock the context providers
const mockProjectContext = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  stats: null,
  fetchProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  setSelectedProject: jest.fn(),
  clearError: jest.fn(),
  fetchProjectStats: jest.fn(),
};

const mockGenerationContext = {
  isGenerating: false,
  progress: null,
  error: null,
  activeGeneration: null,
  startGeneration: jest.fn(),
  cancelActiveGeneration: jest.fn(),
  generateContent: jest.fn(),
  checkGenerationStatus: jest.fn(),
  cancelGeneration: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  setActiveGeneration: jest.fn(),
};

jest.mock('../../../src/context/ProjectContext', () => ({
  ProjectProvider: ({ children }) => <div>{children}</div>,
  useProject: () => mockProjectContext,
}));

jest.mock('../../../src/context/GenerationContext', () => ({
  GenerationProvider: ({ children }) => <div>{children}</div>,
  useGeneration: () => mockGenerationContext,
}));

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should render the app with correct structure', () => {
    render(<App />);
    
    // Check for main container
    expect(screen.getByText('Deeper Research')).toBeInTheDocument();
    
    // Check for sidebar elements
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
    
    // Check for workspace
    expect(screen.getByTestId('workspace')).toBeInTheDocument();
    
    // Check for status bar
    expect(screen.getByText('Backend Connected')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('AI Ready')).toBeInTheDocument();
    expect(screen.getByText('User: Researcher')).toBeInTheDocument();
  });

  it('should display project count in sidebar', () => {
    // Mock projects data
    mockProjectContext.projects = [
      { id: '1', name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
      { id: '2', name: 'Project 2', framework: 'PROJECT_SYNTHETIC' },
    ];
    
    render(<App />);
    
    // Check for project count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    // Mock loading state
    mockProjectContext.loading = true;
    
    render(<App />);
    
    // Check for loading state in status bar
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error banner when error occurs', () => {
    // Mock error state
    mockProjectContext.error = 'Test error message';
    
    render(<App />);
    
    // Check for error banner
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should open new project modal when button is clicked', () => {
    render(<App />);
    
    // Click new project button
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);
    
    // Check for modal elements
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Framework Type')).toBeInTheDocument();
  });

  it('should close new project modal when close button is clicked', () => {
    render(<App />);
    
    // Open modal
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);
    
    // Check modal is open
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    
    // Check modal is closed
    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('should handle form submission for new project', async () => {
    // Mock createProject function
    mockProjectContext.createProject.mockResolvedValue({
      id: '3',
      name: 'New Project',
      framework: 'PROJECT_DEEPDIVE',
    });
    
    render(<App />);
    
    // Open modal
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);
    
    // Fill form
    const nameInput = screen.getByLabelText('Project Name');
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    
    const frameworkSelect = screen.getByLabelText('Framework Type');
    fireEvent.change(frameworkSelect, { target: { value: 'PROJECT_DEEPDIVE' } });
    
    // Submit form
    const submitButton = screen.getByText('Create Project');
    fireEvent.click(submitButton);
    
    // Wait for async operation
    await waitFor(() => {
      expect(mockProjectContext.createProject).toHaveBeenCalledWith(
        'New Project',
        'PROJECT_DEEPDIVE'
      );
    });
  });

  it('should handle form submission error', async () => {
    // Mock createProject function to throw error
    mockProjectContext.createProject.mockRejectedValue(new Error('Failed to create project'));
    
    render(<App />);
    
    // Open modal
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);
    
    // Fill form
    const nameInput = screen.getByLabelText('Project Name');
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    
    const frameworkSelect = screen.getByLabelText('Framework Type');
    fireEvent.change(frameworkSelect, { target: { value: 'PROJECT_DEEPDIVE' } });
    
    // Submit form
    const submitButton = screen.getByText('Create Project');
    fireEvent.click(submitButton);
    
    // Wait for async operation
    await waitFor(() => {
      expect(mockProjectContext.createProject).toHaveBeenCalledWith(
        'New Project',
        'PROJECT_DEEPDIVE'
      );
    });
    
    // Check for error handling
    expect(mockProjectContext.error).toBe('Failed to create project');
  });

  it('should display projects in sidebar', () => {
    // Mock projects data
    mockProjectContext.projects = [
      { 
        id: '1', 
        name: 'Test Project 1', 
        framework: 'PROJECT_DEEPDIVE',
        status: 'New'
      },
      { 
        id: '2', 
        name: 'Test Project 2', 
        framework: 'PROJECT_SYNTHETIC',
        status: 'In Progress'
      },
    ];
    
    render(<App />);
    
    // Check for project items
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('DEEPDIVE')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('SYNTHETIC')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should handle project selection', () => {
    // Mock projects data
    mockProjectContext.projects = [
      { 
        id: '1', 
        name: 'Test Project', 
        framework: 'PROJECT_DEEPDIVE',
        status: 'New'
      },
    ];
    
    render(<App />);
    
    // Click on project
    const projectItem = screen.getByText('Test Project');
    fireEvent.click(projectItem);
    
    // Check if setSelectedProject was called
    expect(mockProjectContext.setSelectedProject).toHaveBeenCalledWith(
      mockProjectContext.projects[0]
    );
  });

  it('should handle project deletion', () => {
    // Mock projects data
    mockProjectContext.projects = [
      { 
        id: '1', 
        name: 'Test Project', 
        framework: 'PROJECT_DEEPDIVE',
        status: 'New'
      },
    ];
    
    // Mock window.confirm
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
    render(<App />);
    
    // Click delete button
    const deleteButton = screen.getByTitle('Delete project');
    fireEvent.click(deleteButton);
    
    // Check if deleteProject was called
    expect(mockProjectContext.deleteProject).toHaveBeenCalledWith('1');
    
    // Restore window.confirm
    window.confirm.mockRestore();
  });

  it('should not delete project when user cancels', () => {
    // Mock projects data
    mockProjectContext.projects = [
      { 
        id: '1', 
        name: 'Test Project', 
        framework: 'PROJECT_DEEPDIVE',
        status: 'New'
      },
    ];
    
    // Mock window.confirm to return false
    jest.spyOn(window, 'confirm').mockImplementation(() => false);
    
    render(<App />);
    
    // Click delete button
    const deleteButton = screen.getByTitle('Delete project');
    fireEvent.click(deleteButton);
    
    // Check if deleteProject was not called
    expect(mockProjectContext.deleteProject).not.toHaveBeenCalled();
    
    // Restore window.confirm
    window.confirm.mockRestore();
  });

  it('should display empty state when no projects', () => {
    // Mock empty projects
    mockProjectContext.projects = [];
    
    render(<App />);
    
    // Check for empty state
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
  });

  it('should handle loading state for new project button', () => {
    // Mock loading state
    mockProjectContext.loading = true;
    
    render(<App />);
    
    // Check if new project button is disabled
    const newProjectButton = screen.getByText('New Project');
    expect(newProjectButton).toBeDisabled();
  });

  it('should handle disabled state for delete buttons during loading', () => {
    // Mock loading state and projects
    mockProjectContext.loading = true;
    mockProjectContext.projects = [
      { 
        id: '1', 
        name: 'Test Project', 
        framework: 'PROJECT_DEEPDIVE',
        status: 'New'
      },
    ];
    
    render(<App />);
    
    // Check if delete button is disabled
    const deleteButton = screen.getByTitle('Delete project');
    expect(deleteButton).toBeDisabled();
  });
});