# Deeper Research Synthetic - Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Main Components](#main-components)
   - [App Component](#app-component)
   - [Workspace Component](#workspace-component)
   - [Layout Components](#layout-components)
   - [Panel Components](#panel-components)
   - [Specialized Components](#specialized-components)
4. [Services](#services)
   - [API Service](#api-service)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [Styling](#styling)
8. [Development Guidelines](#development-guidelines)
9. [Testing](#testing)
10. [Deployment](#deployment)

## Overview

This documentation provides a comprehensive guide to the frontend implementation of the Deeper Research Synthetic project. The frontend is built with React and Vite, and it provides a user interface for managing research projects and interacting with the AI content generation system.

## Project Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets (images, fonts, etc.)
│   ├── components/
│   │   ├── layouts/         # Framework-specific layouts
│   │   ├── panels/          # Reusable panel components
│   │   ├── GenerationControlPanel.jsx
│   │   ├── GenerationProgress.jsx
│   │   └── Workspace.jsx
│   ├── services/
│   │   └── apiService.js    # API client for backend communication
│   ├── App.css              # Global styles
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
├── public/                  # Public assets
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── README.md                # Frontend README
```

## Main Components

### App Component

The main application component that manages global state and renders the main UI.

#### Props
None

#### State
- `projects`: Array of all projects
- `selectedProject`: Currently selected project
- `isCreating`: Boolean indicating if project creation modal is open
- `newProjectName`: String for new project name input
- `newProjectFramework`: String for new project framework selection

#### Methods
- `fetchProjects()`: Retrieves all projects from the backend
- `createProject(e)`: Creates a new project
- `updateProjectContext(projectId, newContext)`: Updates project source context
- `deleteProject(projectId)`: Deletes a project

### Workspace Component

Displays the main workspace for a selected project with framework-specific layouts.

#### Props
- `project`: The currently selected project
- `onUpdateContext`: Function to update project source context
- `onUpdateGeneratedContent`: Function to update generated content
- `onDeleteProject`: Function to delete a project

#### State
None

### Layout Components

Framework-specific layouts that arrange panels differently based on the project framework.

#### DeepdiveLayout.jsx

Layout for PROJECT_DEEPDIVE projects.

##### Panels
- SourcePanel.jsx: Input for source context
- DraftPanel.jsx: Display for generated content
- GenerationControlPanel.jsx: Controls for generation process

#### SyntheticLayout.jsx

Layout for PROJECT_SYNTHETIC projects.

##### Panels
Same as DeepdiveLayout, but arranged differently.

#### BenchmarkLayout.jsx

Layout for PROJECT_BENCHMARK projects.

##### Panels
- PreviewPanel.jsx: Preview of dashboard
- DataInputPanel.jsx: Input for structured data
- DraftPanel.jsx: Display for narrative summary
- GenerationControlPanel.jsx: Controls for generation process

### Panel Components

Reusable UI components for different parts of the interface.

#### SourcePanel.jsx

Provides a text area for entering source material.

##### Props
- `project`: The project being edited

#### DraftPanel.jsx

Displays generated content during and after generation.

##### Props
- `project`: The project being viewed
- `content`: Generated content to display
- `isGenerating`: Whether content is currently being generated

#### DataInputPanel.jsx

Provides input fields for structured data.

##### Props
- `project`: The project being edited

#### PreviewPanel.jsx

Shows a preview of the generated content.

##### Props
- `project`: The project being viewed

### Specialized Components

#### GenerationControlPanel.jsx

Controls for starting/canceling content generation and displaying progress.

##### Props
- `project`: The project for which to control generation
- `onGenerationComplete`: Callback when generation completes
- `onGenerationStart`: Callback when generation starts
- `onGenerationStop`: Callback when generation stops

##### State
- `isGenerating`: Boolean indicating if generation is in progress
- `progress`: Object containing generation progress information

#### GenerationProgress.jsx

Visual display of generation progress.

##### Props
- `progress`: Progress information
- `project`: The project being generated

## Services

### API Service

Handles all communication with the backend API.

Located in `src/services/apiService.js`.

#### Methods

##### Project Management
- `fetchProjects()`: Retrieves all projects
- `createProject(name, framework)`: Creates a new project
- `updateProject(projectId, updates)`: Updates a project
- `deleteProject(projectId)`: Deletes a project

##### Generation Operations
- `startGeneration(project, onProgress, onComplete, onError)`: Starts content generation
- `checkGenerationStatus(projectId)`: Checks generation status
- `cancelGeneration(projectId)`: Cancels active generation

##### Server Operations
- `checkServerStatus()`: Checks server status

## State Management

The frontend uses React's built-in state management with hooks (useState, useEffect) for local component state. For global state that needs to be shared across components, the application uses props drilling pattern.

### State Flow

1. App component manages global projects state
2. Workspace component receives selected project via props
3. Layout components receive project data and callbacks via props
4. Panel components receive project data and callbacks via props
5. Specialized components (GenerationControlPanel) receive project data and callbacks via props

### State Persistence

Project data is persisted in the backend via API calls. Component state is not persisted locally, requiring data to be fetched from the backend on application load.

## Routing

The frontend does not currently implement client-side routing. The application is a single-page application with all views managed through conditional rendering based on state.

### Potential Future Enhancements

1. Implement React Router for navigation between different sections
2. Add URL parameters for deep linking to specific projects

## Styling

The frontend uses CSS modules for component-specific styling, with global styles defined in `src/App.css`.

### CSS Architecture

1. Global styles in `src/App.css`
2. Component-specific styles in respective component files
3. Utility classes for common styling patterns

### Responsive Design

The application uses CSS Grid and Flexbox for responsive layouts that adapt to different screen sizes.

### Styling Conventions

1. Use CSS variables for consistent theming
2. Follow BEM naming convention for CSS classes
3. Use rem units for scalable typography
4. Use CSS Grid for complex layouts
5. Use Flexbox for component alignment

## Development Guidelines

### Component Structure

1. Use functional components with hooks
2. Destructure props at the beginning of the component
3. Use PropTypes for type checking in development
4. Keep components focused on a single responsibility
5. Use meaningful names for components and variables

### File Organization

1. Group related components in directories
2. Use index files to simplify imports
3. Keep component files focused on a single concern
4. Use descriptive names for files and directories

### Performance Considerations

1. Use React.memo for components that render frequently
2. Use useMemo and useCallback for expensive computations
3. Lazy load components that are not immediately needed
4. Optimize images and other assets
5. Minimize re-renders by optimizing state updates

### Accessibility

1. Use semantic HTML elements
2. Provide alt text for images
3. Ensure proper contrast ratios for text
4. Implement keyboard navigation
5. Use ARIA attributes when necessary

## Testing

### Testing Strategy

1. Unit tests for individual components
2. Integration tests for component interactions
3. End-to-end tests for critical user flows
4. Snapshot tests for UI regression prevention

### Testing Tools

1. React Testing Library for component testing
2. Jest for unit and integration tests
3. Cypress or Playwright for end-to-end tests

### Test Coverage Goals

1. Components: 70%+ coverage for critical paths
2. Services: 80%+ coverage
3. Utilities: 90%+ coverage

## Deployment

### Build Process

```bash
npm run build
```

This command creates a production-ready build in the `dist/` directory.

### Hosting

The frontend can be hosted on any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Firebase Hosting

### Environment Configuration

Environment variables can be configured in a `.env.production` file or through the hosting platform's configuration interface.

### Continuous Integration/Continuous Deployment (CI/CD)

1. Set up automated testing on pull requests
2. Configure automated builds on merge to main branch
3. Set up staging environment for preview deployments
4. Implement manual approval for production deployments

This documentation provides a comprehensive guide to the frontend implementation of the Deeper Research Synthetic project. Developers should refer to this document when working on new features or troubleshooting issues.