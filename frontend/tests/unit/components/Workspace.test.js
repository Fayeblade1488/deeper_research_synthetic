/**
 * @file Workspace component unit tests
 * @description Unit tests for the Workspace React component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Workspace from '../../../src/components/Workspace';

// Mock child components
jest.mock('../../../src/components/layouts/DeepdiveLayout', () => {
  return function MockDeepdiveLayout({ project, onUpdateContext, onUpdateGeneratedContent }) {
    return (
      <div data-testid="deepdive-layout">
        <h2>Deepdive Layout</h2>
        <p>Project: {project?.name}</p>
        <button onClick={() => onUpdateContext(project.id, 'Updated context')}>
          Update Context
        </button>
        <button onClick={() => onUpdateGeneratedContent(project.id, 'Generated content', {})}>
          Update Generated Content
        </button>
      </div>
    );
  };
});

jest.mock('../../../src/components/layouts/SyntheticLayout', () => {
  return function MockSyntheticLayout({ project, onUpdateContext, onUpdateGeneratedContent }) {
    return (
      <div data-testid="synthetic-layout">
        <h2>Synthetic Layout</h2>
        <p>Project: {project?.name}</p>
        <button onClick={() => onUpdateContext(project.id, 'Updated context')}>
          Update Context
        </button>
        <button onClick={() => onUpdateGeneratedContent(project.id, 'Generated content', {})}>
          Update Generated Content
        </button>
      </div>
    );
  };
});

jest.mock('../../../src/components/layouts/BenchmarkLayout', () => {
  return function MockBenchmarkLayout({ project, onUpdateContext, onUpdateGeneratedContent }) {
    return (
      <div data-testid="benchmark-layout">
        <h2>Benchmark Layout</h2>
        <p>Project: {project?.name}</p>
        <button onClick={() => onUpdateContext(project.id, 'Updated context')}>
          Update Context
        </button>
        <button onClick={() => onUpdateGeneratedContent(project.id, 'Generated content', {})}>
          Update Generated Content
        </button>
      </div>
    );
  };
});

describe('Workspace', () => {
  const mockProps = {
    project: null,
    onUpdateContext: jest.fn(),
    onUpdateGeneratedContent: jest.fn(),
    onDeleteProject: jest.fn(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no project is selected', () => {
      render(<Workspace {...mockProps} />);
      
      // Check for empty state elements
      expect(screen.getByText('Select a project or create a new one to begin.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('🔬')).toBeInTheDocument();
    });

    it('should render empty state with correct styling', () => {
      render(<Workspace {...mockProps} />);
      
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('empty-state');
    });
  });

  describe('Framework Layouts', () => {
    it('should render DeepdiveLayout for PROJECT_DEEPDIVE framework', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for Deepdive layout
      expect(screen.getByTestId('deepdive-layout')).toBeInTheDocument();
      expect(screen.getByText('Deepdive Layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Project')).toBeInTheDocument();
      
      // Ensure other layouts are not rendered
      expect(screen.queryByTestId('synthetic-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('benchmark-layout')).not.toBeInTheDocument();
    });

    it('should render SyntheticLayout for PROJECT_SYNTHETIC framework', () => {
      const project = {
        id: '2',
        name: 'Test Podcast',
        framework: 'PROJECT_SYNTHETIC',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for Synthetic layout
      expect(screen.getByTestId('synthetic-layout')).toBeInTheDocument();
      expect(screen.getByText('Synthetic Layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Podcast')).toBeInTheDocument();
      
      // Ensure other layouts are not rendered
      expect(screen.queryByTestId('deepdive-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('benchmark-layout')).not.toBeInTheDocument();
    });

    it('should render BenchmarkLayout for PROJECT_BENCHMARK framework', () => {
      const project = {
        id: '3',
        name: 'Test Benchmark',
        framework: 'PROJECT_BENCHMARK',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for Benchmark layout
      expect(screen.getByTestId('benchmark-layout')).toBeInTheDocument();
      expect(screen.getByText('Benchmark Layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Benchmark')).toBeInTheDocument();
      
      // Ensure other layouts are not rendered
      expect(screen.queryByTestId('deepdive-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('synthetic-layout')).not.toBeInTheDocument();
    });

    it('should render unknown framework message for invalid framework', () => {
      const project = {
        id: '4',
        name: 'Invalid Project',
        framework: 'INVALID_FRAMEWORK',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for unknown framework message
      expect(screen.getByText('Unknown project framework.')).toBeInTheDocument();
      expect(screen.getByText('Framework: INVALID_FRAMEWORK')).toBeInTheDocument();
    });

    it('should handle null project gracefully', () => {
      render(<Workspace {...mockProps} project={null} />);
      
      // Should render empty state
      expect(screen.getByText('Select a project or create a new one to begin.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should handle undefined project gracefully', () => {
      render(<Workspace {...mockProps} project={undefined} />);
      
      // Should render empty state
      expect(screen.getByText('Select a project or create a new one to begin.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Project Header', () => {
    it('should render project header with project name', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for project header
      expect(screen.getByTestId('project-heading')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render project framework badge', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for framework badge
      expect(screen.getByText('DEEPDIVE')).toBeInTheDocument();
      expect(screen.getByTestId('framework-badge')).toBeInTheDocument();
    });

    it('should render project status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'In Progress',
        version: 1,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for project status
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByTestId('project-status')).toBeInTheDocument();
    });

    it('should render project ID', () => {
      const project = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for project ID
      expect(screen.getByText('Project ID: 550e8400')).toBeInTheDocument();
    });

    it('should render project timestamps', () => {
      const createdAt = new Date('2023-01-01T00:00:00Z');
      const updatedAt = new Date('2023-01-02T00:00:00Z');
      
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check for timestamps
      expect(screen.getByText(`Created: ${createdAt.toLocaleDateString()}`)).toBeInTheDocument();
      expect(screen.getByText(`Updated: ${updatedAt.toLocaleDateString()}`)).toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('should call onUpdateContext when layout triggers update', async () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      const onUpdateContext = jest.fn();
      
      render(<Workspace {...mockProps} project={project} onUpdateContext={onUpdateContext} />);
      
      // Click update context button in DeepdiveLayout
      const updateContextButton = screen.getByText('Update Context');
      fireEvent.click(updateContextButton);
      
      // Verify callback was called
      await waitFor(() => {
        expect(onUpdateContext).toHaveBeenCalledWith('1', 'Updated context');
      });
    });

    it('should call onUpdateGeneratedContent when layout triggers update', async () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      const onUpdateGeneratedContent = jest.fn();
      
      render(<Workspace {...mockProps} project={project} onUpdateGeneratedContent={onUpdateGeneratedContent} />);
      
      // Click update generated content button in DeepdiveLayout
      const updateContentButton = screen.getByText('Update Generated Content');
      fireEvent.click(updateContentButton);
      
      // Verify callback was called
      await waitFor(() => {
        expect(onUpdateGeneratedContent).toHaveBeenCalledWith('1', 'Generated content', {});
      });
    });

    it('should call onDeleteProject when delete button is clicked', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      const onDeleteProject = jest.fn();
      
      render(<Workspace {...mockProps} project={project} onDeleteProject={onDeleteProject} />);
      
      // Click delete button
      const deleteButton = screen.getByTitle('Delete project');
      fireEvent.click(deleteButton);
      
      // Verify callback was called
      expect(onDeleteProject).toHaveBeenCalledWith('1');
    });

    it('should handle missing callback functions gracefully', async () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      // Render without callback functions
      render(<Workspace project={project} />);
      
      // Click update context button in DeepdiveLayout
      const updateContextButton = screen.getByText('Update Context');
      fireEvent.click(updateContextButton);
      
      // Should not crash
      expect(screen.getByTestId('deepdive-layout')).toBeInTheDocument();
    });
  });

  describe('Layout Rendering', () => {
    it('should pass correct props to DeepdiveLayout', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: 'Previous content',
        generationMetadata: { wordCount: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Completed',
        version: 1,
      };
      
      const onUpdateContext = jest.fn();
      const onUpdateGeneratedContent = jest.fn();
      const onDeleteProject = jest.fn();
      
      render(
        <Workspace 
          project={project}
          onUpdateContext={onUpdateContext}
          onUpdateGeneratedContent={onUpdateGeneratedContent}
          onDeleteProject={onDeleteProject}
        />
      );
      
      // Verify DeepdiveLayout receives correct props
      expect(screen.getByTestId('deepdive-layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Project')).toBeInTheDocument();
    });

    it('should pass correct props to SyntheticLayout', () => {
      const project = {
        id: '2',
        name: 'Test Podcast',
        framework: 'PROJECT_SYNTHETIC',
        sourceContext: 'Test context',
        generatedContent: 'Previous content',
        generationMetadata: { wordCount: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Completed',
        version: 1,
      };
      
      const onUpdateContext = jest.fn();
      const onUpdateGeneratedContent = jest.fn();
      const onDeleteProject = jest.fn();
      
      render(
        <Workspace 
          project={project}
          onUpdateContext={onUpdateContext}
          onUpdateGeneratedContent={onUpdateGeneratedContent}
          onDeleteProject={onDeleteProject}
        />
      );
      
      // Verify SyntheticLayout receives correct props
      expect(screen.getByTestId('synthetic-layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Podcast')).toBeInTheDocument();
    });

    it('should pass correct props to BenchmarkLayout', () => {
      const project = {
        id: '3',
        name: 'Test Benchmark',
        framework: 'PROJECT_BENCHMARK',
        sourceContext: 'Test context',
        generatedContent: 'Previous content',
        generationMetadata: { wordCount: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Completed',
        version: 1,
      };
      
      const onUpdateContext = jest.fn();
      const onUpdateGeneratedContent = jest.fn();
      const onDeleteProject = jest.fn();
      
      render(
        <Workspace 
          project={project}
          onUpdateContext={onUpdateContext}
          onUpdateGeneratedContent={onUpdateGeneratedContent}
          onDeleteProject={onDeleteProject}
        />
      );
      
      // Verify BenchmarkLayout receives correct props
      expect(screen.getByTestId('benchmark-layout')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Benchmark')).toBeInTheDocument();
    });
  });

  describe('Framework Badge Styling', () => {
    it('should apply correct styling for PROJECT_DEEPDIVE framework', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const frameworkBadge = screen.getByTestId('framework-badge');
      expect(frameworkBadge).toHaveClass('framework-badge');
      expect(frameworkBadge).toHaveClass('deepdive');
    });

    it('should apply correct styling for PROJECT_SYNTHETIC framework', () => {
      const project = {
        id: '2',
        name: 'Test Podcast',
        framework: 'PROJECT_SYNTHETIC',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const frameworkBadge = screen.getByTestId('framework-badge');
      expect(frameworkBadge).toHaveClass('framework-badge');
      expect(frameworkBadge).toHaveClass('synthetic');
    });

    it('should apply correct styling for PROJECT_BENCHMARK framework', () => {
      const project = {
        id: '3',
        name: 'Test Benchmark',
        framework: 'PROJECT_BENCHMARK',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const frameworkBadge = screen.getByTestId('framework-badge');
      expect(frameworkBadge).toHaveClass('framework-badge');
      expect(frameworkBadge).toHaveClass('benchmark');
    });

    it('should apply default styling for unknown framework', () => {
      const project = {
        id: '4',
        name: 'Invalid Project',
        framework: 'INVALID_FRAMEWORK',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should render unknown framework message instead of badge
      expect(screen.getByText('Unknown project framework.')).toBeInTheDocument();
    });
  });

  describe('Status Badge Styling', () => {
    it('should apply correct styling for New status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('new');
    });

    it('should apply correct styling for In Progress status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'In Progress',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('in-progress');
    });

    it('should apply correct styling for Completed status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: 'Generated content',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Completed',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('completed');
    });

    it('should apply correct styling for Failed status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Failed',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('failed');
    });

    it('should apply correct styling for Cancelled status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Cancelled',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('cancelled');
    });

    it('should apply default styling for unknown status', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Unknown Status',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      const statusBadge = screen.getByTestId('project-status');
      expect(statusBadge).toHaveClass('status-badge');
      expect(statusBadge).toHaveClass('default');
    });
  });

  describe('Project Details Display', () => {
    it('should display all project details correctly', () => {
      const createdAt = new Date('2023-01-01T12:00:00Z');
      const updatedAt = new Date('2023-01-02T12:00:00Z');
      
      const project = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Comprehensive Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context with sufficient length for testing.',
        generatedContent: 'Generated content with sufficient length for testing.',
        generationMetadata: {
          wordCount: 15000,
          generationTime: 120,
          timestamp: new Date().toISOString(),
          validation: {
            valid: true,
            errors: [],
            warnings: [],
            wordCount: 15000,
          },
          provider: 'Mock AI',
          privacyMode: 'enabled',
          dataRetention: 'zero',
        },
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        status: 'Completed',
        version: 3,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Check all project details are displayed
      expect(screen.getByText('Comprehensive Test Project')).toBeInTheDocument();
      expect(screen.getByText('DEEPDIVE')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Project ID: 550e8400')).toBeInTheDocument();
      expect(screen.getByText(`Created: ${createdAt.toLocaleDateString()}`)).toBeInTheDocument();
      expect(screen.getByText(`Updated: ${updatedAt.toLocaleDateString()}`)).toBeInTheDocument();
      expect(screen.getByText('Version: 3')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', () => {
      const project = {
        id: '1',
        name: 'Minimal Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        // Missing optional fields: generationMetadata, status, version
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should display default values for missing fields
      expect(screen.getByText('New')).toBeInTheDocument(); // Default status
      expect(screen.getByText('Version: 0')).toBeInTheDocument(); // Default version
    });

    it('should handle null optional fields gracefully', () => {
      const project = {
        id: '1',
        name: 'Null Fields Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        generationMetadata: null,
        status: null,
        version: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should display default values for null fields
      expect(screen.getByText('New')).toBeInTheDocument(); // Default status
      expect(screen.getByText('Version: 0')).toBeInTheDocument(); // Default version
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long project names', () => {
      const longName = 'A'.repeat(200); // Maximum allowed length
      const project = {
        id: '1',
        name: longName,
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should display the full name (or truncated version if implemented)
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in project name', () => {
      const specialName = 'Project with <script>alert("xss")</script> & other chars';
      const project = {
        id: '1',
        name: specialName,
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should display the name as-is (it's not a security issue in this context)
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('should handle invalid date formats gracefully', () => {
      const project = {
        id: '1',
        name: 'Invalid Date Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should handle invalid dates gracefully
      expect(screen.getByText('Invalid Date Project')).toBeInTheDocument();
    });

    it('should handle missing date fields gracefully', () => {
      const project = {
        id: '1',
        name: 'Missing Dates Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        // Missing createdAt and updatedAt
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should handle missing dates gracefully
      expect(screen.getByText('Missing Dates Project')).toBeInTheDocument();
    });

    it('should handle undefined date fields gracefully', () => {
      const project = {
        id: '1',
        name: 'Undefined Dates Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: 'Test context',
        generatedContent: '',
        generationMetadata: null,
        createdAt: undefined,
        updatedAt: undefined,
        status: 'New',
        version: 0,
      };
      
      render(<Workspace {...mockProps} project={project} />);
      
      // Should handle undefined dates gracefully
      expect(screen.getByText('Undefined Dates Project')).toBeInTheDocument();
    });
  });
});