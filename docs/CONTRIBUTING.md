# Contributing to Deeper Research Synthetic

## Welcome!

Thank you for considering contributing to Deeper Research Synthetic! This document provides guidelines and information to help you contribute effectively to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
   - [Project Overview](#project-overview)
   - [Development Environment](#development-environment)
3. [How to Contribute](#how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Enhancements](#suggesting-enhancements)
   - [Code Contributions](#code-contributions)
4. [Development Workflow](#development-workflow)
   - [Branching Strategy](#branching-strategy)
   - [Commit Messages](#commit-messages)
   - [Pull Requests](#pull-requests)
5. [Coding Standards](#coding-standards)
   - [JavaScript/Node.js](#javascriptnodejs)
   - [React](#react)
   - [CSS](#css)
6. [Testing](#testing)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [End-to-End Testing](#end-to-end-testing)
7. [Documentation](#documentation)
   - [Code Documentation](#code-documentation)
   - [User Documentation](#user-documentation)
8. [Security](#security)
9. [Community](#community)
10. [License](#license)

## Code of Conduct

This project adheres to the Contributor Covenant [code of conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [security@fayeblade.dev](mailto:security@fayeblade.dev).

## Getting Started

### Project Overview

Deeper Research Synthetic is an agentic, self-sustaining ecosystem for generating and disseminating deep, unbiased understanding of critical global issues. The project combats "AI slop" by producing iron-clad, respected analysis through three distinct content frameworks:

1. **PROJECT_DEEPDIVE**: Exhaustive academic-style white papers (10,000+ words)
2. **PROJECT_SYNTHETIC**: Narrative-driven podcast episodes (15,000+ words)
3. **PROJECT_BENCHMARK**: Data-driven crisis dashboards with DEFCON assessment (5,000+ words)

The project follows a 5-phase development plan with a focus on transparency, user control, and framework-based generation of high-quality, unbiased analysis.

### Development Environment

To set up your development environment:

1. **Prerequisites**:
   - Node.js (version 14 or higher)
   - npm or yarn package manager
   - Git for version control
   - A Google Gemini API key for development

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/Fayeblade1488/deeper_research_synthetic.git
   cd deeper_research_synthetic
   ```

3. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your GEMINI_API_KEY to the .env file
   ```

4. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

5. **Run Development Servers**:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory (in a new terminal)
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

Before submitting a bug report, please check if the issue has already been reported by searching the [GitHub issues](https://github.com/Fayeblade1488/deeper_research_synthetic/issues).

When reporting a bug, please include:

1. **Clear and descriptive title**
2. **Steps to reproduce** the bug
3. **Expected behavior** vs. **actual behavior**
4. **Screenshots or animated GIFs** if applicable
5. **Environment information** (OS, browser, Node.js version, etc.)
6. **Code snippet** or **repository link** if relevant

Example bug report:
```
Title: Generation fails with empty source context

Steps to reproduce:
1. Create a new PROJECT_DEEPDIVE project
2. Leave source context empty
3. Click "Initiate Generation"

Expected behavior:
Should show validation error message

Actual behavior:
Generation starts but fails silently

Environment:
- OS: macOS 14.0
- Browser: Chrome 118.0.5993.88
- Node.js: v18.17.1
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Before creating an enhancement suggestion, please check if a similar idea has already been proposed.

When suggesting an enhancement, please include:

1. **Clear and descriptive title**
2. **Detailed description** of the proposed enhancement
3. **Motivation** for the enhancement
4. **Implementation approach** if you have ideas
5. **Benefits** of the enhancement
6. **Potential drawbacks** or trade-offs

Example enhancement suggestion:
```
Title: Add support for custom framework templates

Description:
Allow users to create and save custom framework templates for content generation.

Motivation:
While the three built-in frameworks cover many use cases, users may want to create content that follows different structures or guidelines.

Implementation approach:
1. Add UI for creating/editing custom framework templates
2. Store templates in the database
3. Allow users to select custom templates when creating projects
4. Implement validation for custom templates

Benefits:
- Increased flexibility for diverse content needs
- Ability to tailor output to specific requirements
- User customization options

Potential drawbacks:
- Increased complexity in UI
- Need for template validation
```

### Code Contributions

#### Finding Issues to Work On

Look for issues labeled with:
- `good first issue` - Good for newcomers
- `help wanted` - Ready for contribution
- `bug` - Confirmed bugs that need fixing
- `enhancement` - Feature requests that are ready for implementation

#### Claiming Issues

1. Comment on the issue expressing interest
2. Wait for a maintainer to assign the issue to you
3. Fork the repository and create a branch for your work

## Development Workflow

### Branching Strategy

We follow a simplified Git branching model:

1. **main**: Production-ready code
2. **develop**: Development branch with latest features
3. **feature/your-feature-name**: Feature branches for new functionality
4. **hotfix/issue-name**: Hotfix branches for urgent bug fixes

#### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

Example commit messages:
```
feat(generation): add streaming progress updates

- Implement Server-Sent Events for real-time generation updates
- Add progress bar component to UI
- Update generation service to emit progress events

fix(validation): correct word count validation for PROJECT_BENCHMARK

- Fix minimum word count from 10000 to 5000
- Update validation tests
- Add validation error messages to UI
```

### Pull Requests

#### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a pull request against the `develop` branch

3. Fill out the pull request template with:
   - Description of changes
   - Related issues
   - Screenshots (if applicable)
   - Testing instructions

#### Pull Request Review Process

1. **Automated Checks**: All PRs must pass CI checks
2. **Code Review**: At least one maintainer must review and approve
3. **Testing**: Changes must be adequately tested
4. **Documentation**: Code changes must be documented
5. **Merge**: Once approved, PR will be merged by a maintainer

#### Pull Request Best Practices

1. **Keep PRs small and focused** on a single issue or feature
2. **Write clear descriptions** explaining what changed and why
3. **Include tests** for new functionality
4. **Update documentation** when making user-facing changes
5. **Address feedback promptly** during the review process

## Coding Standards

### JavaScript/Node.js

#### Style Guide

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some project-specific modifications.

Key guidelines:
1. **Use const/let** instead of var
2. **Arrow functions** for anonymous functions
3. **Template literals** for string interpolation
4. **Destructuring** for object/array access
5. **Async/await** instead of callbacks
6. **Modules** for code organization

#### Example Code

```javascript
// backend/services/generationService.js
const { generateWithStreaming } = require('../config/gemini');
const { constructPrompt } = require('./frameworkService');
const { validateOutput } = require('./validationService');

/**
 * Generate content for a project with streaming and validation
 * @param {Object} project - The project object
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Generation result with content and metadata
 */
async function generateContent(project, onProgress) {
  const { framework, sourceContext, name } = project;
  
  // Validate inputs
  if (!sourceContext || sourceContext.trim().length === 0) {
    throw new Error('Source context is required for generation');
  }
  
  try {
    // Construct full prompt
    const prompt = await constructPrompt(framework, sourceContext);
    
    // Track generation progress
    let generatedText = '';
    let wordCount = 0;
    let chunkCount = 0;
    
    const startTime = Date.now();
    
    // Generate with streaming
    generatedText = await generateWithStreaming(prompt, (chunk) => {
      chunkCount++;
      generatedText += chunk;
      wordCount = countWords(generatedText);
      
      // Send progress update every 10 chunks
      if (chunkCount % 10 === 0 && onProgress) {
        onProgress({
          type: 'progress',
          wordCount,
          chunkCount,
          estimatedProgress: Math.min((wordCount / 10000) * 100, 95),
        });
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds
    
    // Final word count
    wordCount = countWords(generatedText);
    
    // Validate output
    const validation = validateOutput(generatedText, framework);
    
    // Send completion update
    if (onProgress) {
      onProgress({
        type: 'complete',
        wordCount,
        duration,
        validation,
      });
    }
    
    return {
      content: generatedText,
      metadata: {
        framework,
        wordCount,
        generationTime: duration,
        timestamp: new Date().toISOString(),
        validation,
      },
    };
    
  } catch (error) {
    console.error('Generation error:', error);
    
    if (onProgress) {
      onProgress({
        type: 'error',
        error: error.message,
      });
    }
    
    throw new Error(`Generation failed: ${error.message}`);
  }
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

module.exports = {
  generateContent,
  countWords,
};
```

#### Error Handling

1. **Use specific error types** when possible
2. **Provide meaningful error messages**
3. **Log errors appropriately**
4. **Don't expose internal errors to users**

```javascript
// backend/services/errorService.js
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
};
```

### React

#### Component Structure

1. **Functional components** with hooks
2. **PropTypes** for type checking in development
3. **Descriptive component names**
4. **Logical grouping** of related code

#### Example Component

```jsx
// frontend/src/components/GenerationControlPanel.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { startGeneration } from '../services/apiService';

/**
 * GenerationControlPanel - Controls for starting/canceling content generation
 * @param {Object} props - Component properties
 * @param {Object} props.project - The project for which to control generation
 * @param {Function} props.onGenerationComplete - Callback when generation completes
 * @param {Function} props.onGenerationStart - Callback when generation starts
 * @param {Function} props.onGenerationStop - Callback when generation stops
 */
const GenerationControlPanel = ({ 
  project, 
  onGenerationComplete, 
  onGenerationStart, 
  onGenerationStop 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (project?.id) {
      checkCurrentStatus();
    }
  }, [project]);

  const checkCurrentStatus = async () => {
    if (!project?.id) return;
    
    try {
      // Implementation for checking status
    } catch (error) {
      console.error('Error checking generation status:', error);
    }
  };

  const handleStartGeneration = async () => {
    if (!project) return;

    setIsGenerating(true);
    if (onGenerationStart) onGenerationStart();

    setProgress({
      type: 'start',
      wordCount: 0,
      chunkCount: 0,
      estimatedProgress: 0,
    });

    try {
      // Start generation with streaming
      startGeneration(
        project,
        // onProgress
        (progressData) => {
          setProgress(progressData);
        },
        // onComplete
        (completeData) => {
          setIsGenerating(false);
          if (onGenerationStop) onGenerationStop();
          
          setProgress({
            type: 'complete',
            wordCount: completeData.metadata?.wordCount || 0,
            duration: completeData.metadata?.generationTime,
            validation: completeData.metadata?.validation,
          });
          
          if (onGenerationComplete) {
            onGenerationComplete(completeData.content, completeData.metadata);
          }
        },
        // onError
        (errorMessage) => {
          setIsGenerating(false);
          if (onGenerationStop) onGenerationStop();
          
          setProgress({
            type: 'error',
            error: errorMessage,
          });
        }
      );
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      if (onGenerationStop) onGenerationStop();
    }
  };

  const handleCancelGeneration = async () => {
    // Implementation for canceling generation
    setIsGenerating(false);
    if (onGenerationStop) onGenerationStop();
  };

  if (!project) {
    return (
      <div className="panel">
        <h3>Generation Controls</h3>
        <p>Select a project to begin generation.</p>
      </div>
    );
  }

  return (
    <div className="panel generation-control-panel">
      <h3>Keystone: SPARK</h3>
      <div className="generation-controls">
        <div className="control-buttons">
          {!isGenerating ? (
            <button 
              className="generate-btn" 
              onClick={handleStartGeneration}
              disabled={isGenerating || !project.sourceContext}
            >
              {project.sourceContext ? 'Initiate Generation' : 'Add Source Context First'}
            </button>
          ) : (
            <button 
              className="cancel-btn" 
              onClick={handleCancelGeneration}
            >
              Cancel Generation
            </button>
          )}
        </div>

        {progress && (
          <div className="generation-progress">
            {progress.type === 'start' && (
              <div className="status">Ready to begin generation...</div>
            )}
            
            {progress.type === 'progress' && (
              <div className="progress-details">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(progress.estimatedProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="progress-info">
                  <span className="word-count">{progress.wordCount} words generated</span>
                  <span className="chunk-count">{progress.chunkCount} chunks</span>
                  <span className="progress-percent">{Math.round(progress.estimatedProgress)}%</span>
                </div>
              </div>
            )}
            
            {progress.type === 'complete' && (
              <div className="generation-complete">
                <div className="status success">Generation Complete!</div>
                <div className="completion-stats">
                  <span className="word-count">{progress.wordCount} words</span>
                  <span className="duration">{progress.duration?.toFixed(1)}s</span>
                </div>
                {progress.validation && (
                  <div className="validation-results">
                    {progress.validation.valid ? (
                      <span className="validation-success">✓ Content meets framework requirements</span>
                    ) : (
                      <div className="validation-errors">
                        <span className="validation-fail">⚠ Validation issues found:</span>
                        <ul>
                          {progress.validation.errors.map((error, idx) => (
                            <li key={idx} className="error">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {progress.type === 'error' && (
              <div className="generation-error">
                <div className="status error">Generation Error: {progress.error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

GenerationControlPanel.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    framework: PropTypes.oneOf([
      'PROJECT_DEEPDIVE',
      'PROJECT_SYNTHETIC',
      'PROJECT_BENCHMARK'
    ]).isRequired,
    sourceContext: PropTypes.string,
  }),
  onGenerationComplete: PropTypes.func,
  onGenerationStart: PropTypes.func,
  onGenerationStop: PropTypes.func,
};

GenerationControlPanel.defaultProps = {
  project: null,
  onGenerationComplete: () => {},
  onGenerationStart: () => {},
  onGenerationStop: () => {},
};

export default GenerationControlPanel;
```

#### State Management

1. **Use useState/useReducer** for component state
2. **Lift state up** when needed by multiple components
3. **Use Context API** for global state
4. **Consider Redux** for complex state management

#### Hooks Usage

1. **Custom hooks** for reusable logic
2. **useEffect** for side effects
3. **useCallback/useMemo** for performance optimization
4. **Proper dependency arrays** in useEffect

### CSS

#### Styling Guidelines

1. **CSS Modules** for component-scoped styles
2. **BEM naming convention** for class names
3. **CSS custom properties** for themes
4. **Mobile-first approach** for responsive design

#### Example CSS Module

```css
/* frontend/src/components/GenerationControlPanel.module.css */
.generationControlPanel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.buttonPrimary {
  composes: button;
  background-color: var(--primary-color);
  color: white;
}

.buttonPrimary:hover:not(:disabled) {
  background-color: var(--primary-color-hover);
}

.buttonSecondary {
  composes: button;
  background-color: var(--secondary-color);
  color: var(--text-primary);
}

.buttonSecondary:hover:not(:disabled) {
  background-color: var(--secondary-color-hover);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progressContainer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progressBar {
  width: 100%;
  height: 8px;
  background-color: var(--progress-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background-color: var(--progress-fill);
  transition: width 0.3s ease;
}

.statusText {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}

@media (max-width: 768px) {
  .generationControlPanel {
    padding: 0.75rem;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .button {
    width: 100%;
  }
}
```

## Testing

### Unit Testing

We use Jest for unit testing with a target coverage of 80%+ for critical components.

#### Writing Unit Tests

```javascript
// backend/tests/unit/generationService.test.js
const { generateContent, countWords } = require('../../services/generationService');
const { generateWithStreaming } = require('../../config/gemini');
const { constructPrompt } = require('../../services/frameworkService');
const { validateOutput } = require('../../services/validationService');

// Mock dependencies
jest.mock('../../config/gemini');
jest.mock('../../services/frameworkService');
jest.mock('../../services/validationService');

describe('Generation Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      framework: 'PROJECT_DEEPDIVE',
      sourceContext: 'This is test source context.',
    };

    test('should generate content successfully', async () => {
      // Mock dependencies
      constructPrompt.mockResolvedValue('Test prompt');
      generateWithStreaming.mockImplementation((prompt, callback) => {
        callback('Generated ');
        callback('content.');
        return Promise.resolve('Generated content.');
      });
      validateOutput.mockReturnValue({ valid: true, errors: [], warnings: [] });

      const onProgress = jest.fn();
      const result = await generateContent(mockProject, onProgress);

      // Assertions
      expect(constructPrompt).toHaveBeenCalledWith('PROJECT_DEEPDIVE', 'This is test source context.');
      expect(generateWithStreaming).toHaveBeenCalled();
      expect(validateOutput).toHaveBeenCalledWith('Generated content.', 'PROJECT_DEEPDIVE');
      expect(result).toEqual({
        content: 'Generated content.',
        metadata: expect.objectContaining({
          framework: 'PROJECT_DEEPDIVE',
          wordCount: 2,
          generationTime: expect.any(Number),
          timestamp: expect.any(String),
          validation: { valid: true, errors: [], warnings: [] },
        }),
      });
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ type: 'complete' }));
    });

    test('should throw error when source context is empty', async () => {
      const projectWithoutContext = { ...mockProject, sourceContext: '' };

      await expect(generateContent(projectWithoutContext, jest.fn()))
        .rejects
        .toThrow('Source context is required for generation');
    });

    test('should handle generation errors', async () => {
      constructPrompt.mockResolvedValue('Test prompt');
      generateWithStreaming.mockRejectedValue(new Error('Generation failed'));
      
      const onProgress = jest.fn();
      
      await expect(generateContent(mockProject, onProgress))
        .rejects
        .toThrow('Generation failed: Generation failed');
      
      expect(onProgress).toHaveBeenCalledWith({ type: 'error', error: 'Generation failed' });
    });
  });

  describe('countWords', () => {
    test('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  Hello   world  ')).toBe(2);
      expect(countWords('')).toBe(0);
      expect(countWords('One')).toBe(1);
    });

    test('should handle edge cases', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords('Multiple    spaces')).toBe(2);
    });
  });
});
```

#### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test tests/unit/generationService.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Testing

Integration tests verify that different parts of the application work together correctly.

#### Example Integration Test

```javascript
// backend/tests/integration/api.test.js
const request = require('supertest');
const app = require('../../server');
const Project = require('../../models/Project');

describe('API Integration Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    await Project.deleteMany({});
  });

  describe('Project Management', () => {
    test('should create a project successfully', async () => {
      const projectData = {
        name: 'Integration Test Project',
        framework: 'PROJECT_DEEPDIVE'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Integration Test Project',
        framework: 'PROJECT_DEEPDIVE',
        sourceContext: '',
        generatedContent: '',
        status: 'New'
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    test('should retrieve all projects', async () => {
      // Create test projects
      await Project.create([
        { name: 'Project 1', framework: 'PROJECT_DEEPDIVE' },
        { name: 'Project 2', framework: 'PROJECT_SYNTHETIC' }
      ]);

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[1]).toHaveProperty('framework');
    });

    test('should update a project', async () => {
      // Create a project
      const project = await Project.create({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE'
      });

      const updateData = {
        sourceContext: 'Updated source context',
        generatedContent: 'Generated content'
      };

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.sourceContext).toBe('Updated source context');
      expect(response.body.generatedContent).toBe('Generated content');
      expect(response.body.updatedAt).not.toBe(project.updatedAt);
    });

    test('should delete a project', async () => {
      // Create a project
      const project = await Project.create({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE'
      });

      await request(app)
        .delete(`/api/projects/${project.id}`)
        .expect(204);

      // Verify project was deleted
      const deletedProject = await Project.findById(project.id);
      expect(deletedProject).toBeNull();
    });
  });
});
```

### End-to-End Testing

End-to-end tests verify critical user flows from start to finish.

#### Example End-to-End Test

```javascript
// frontend/tests/e2e/projectManagement.test.js
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should allow creating a new project', async ({ page }) => {
    // Click "New Project" button
    await page.click('button:has-text("+ New Project")');
    
    // Fill in project details
    await page.fill('input[placeholder*="Project Name"]', 'E2E Test Project');
    await page.selectOption('select', 'PROJECT_DEEPDIVE');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Verify project appears in list
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should allow adding source context', async ({ page }) => {
    // Select existing project or create one first
    await page.click('text=Test Project');
    
    // Add source context
    await page.fill('textarea[placeholder*="source material"]', 'This is test source context for E2E testing.');
    
    // Blur to trigger save
    await page.locator('textarea[placeholder*="source material"]').blur();
    
    // Verify source context was saved (this would require backend verification)
    // For now, just verify the text was entered
    await expect(page.locator('textarea[placeholder*="source material"]')).toHaveValue('This is test source context for E2E testing.');
  });

  test('should allow deleting a project', async ({ page }) => {
    // Select project to delete
    await page.click('text=Test Project');
    
    // Click delete button
    await page.click('button:has-text("Delete Project")');
    
    // Confirm deletion
    await page.on('dialog', dialog => dialog.accept());
    
    // Verify project is removed from list
    await expect(page.locator('text=Test Project')).not.toBeVisible();
  });
});
```

## Documentation

### Code Documentation

All public functions, classes, and modules should have comprehensive JSDoc comments.

#### Example Documentation

```javascript
/**
 * Generate content for a project with streaming and validation
 * 
 * This function orchestrates the entire content generation process, including:
 * 1. Validating input parameters
 * 2. Constructing framework-specific prompts
 * 3. Generating content with the Gemini API
 * 4. Tracking generation progress
 * 5. Validating the generated output
 * 6. Returning structured results with metadata
 * 
 * @param {Object} project - The project object containing generation parameters
 * @param {string} project.id - Unique identifier for the project
 * @param {string} project.name - Name of the project
 * @param {string} project.framework - Framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)
 * @param {string} project.sourceContext - Source material to base generation on
 * @param {Function} onProgress - Callback function for progress updates
 * @param {Object} onProgress.progressData - Progress information
 * @param {string} onProgress.progressData.type - Type of progress update (start, progress, complete, error)
 * @param {number} [onProgress.progressData.wordCount] - Current word count (for progress updates)
 * @param {number} [onProgress.progressData.chunkCount] - Number of chunks processed (for progress updates)
 * @param {number} [onProgress.progressData.estimatedProgress] - Estimated completion percentage (for progress updates)
 * @param {number} [onProgress.progressData.duration] - Generation duration in seconds (for complete updates)
 * @param {Object} [onProgress.progressData.validation] - Validation results (for complete updates)
 * @param {string} [onProgress.progressData.error] - Error message (for error updates)
 * 
 * @returns {Promise<Object>} Generation result with content and metadata
 * @returns {string} returns.content - The generated content
 * @returns {Object} returns.metadata - Metadata about the generation process
 * @returns {string} returns.metadata.framework - The framework used for generation
 * @returns {number} returns.metadata.wordCount - Word count of generated content
 * @returns {number} returns.metadata.generationTime - Time taken for generation in seconds
 * @returns {string} returns.metadata.timestamp - ISO timestamp of generation completion
 * @returns {Object} returns.metadata.validation - Validation results
 * @returns {boolean} returns.metadata.validation.valid - Whether content meets framework requirements
 * @returns {string[]} returns.metadata.validation.errors - Validation errors (if any)
 * @returns {string[]} returns.metadata.validation.warnings - Validation warnings (if any)
 * 
 * @throws {Error} If source context is missing or invalid
 * @throws {Error} If framework is unsupported
 * @throws {Error} If generation fails
 * 
 * @example
 * const project = {
 *   id: 'project-123',
 *   name: 'Climate Change Analysis',
 *   framework: 'PROJECT_DEEPDIVE',
 *   sourceContext: 'Climate change is affecting the planet in numerous ways...'
 * };
 * 
 * const result = await generateContent(project, (progress) => {
 *   console.log('Progress:', progress);
 * });
 * 
 * console.log('Generated content:', result.content);
 * console.log('Word count:', result.metadata.wordCount);
 */
async function generateContent(project, onProgress) {
  // Implementation here
}
```

### User Documentation

User documentation should be clear, concise, and accessible to non-technical users.

#### README Updates

When adding new features, update the README with:

1. **Feature description**
2. **Usage instructions**
3. **Examples**
4. **Screenshots** (if applicable)

#### Example README Section

```markdown
## New Feature: Custom Framework Templates

### Overview

The Custom Framework Templates feature allows users to create and save their own framework templates for content generation. This provides flexibility for users who need to generate content that follows specific structures or guidelines not covered by the built-in frameworks.

### Usage

1. **Create a Custom Template**:
   - Navigate to the "Templates" section in the sidebar
   - Click "New Template"
   - Enter a name and description for your template
   - Define the template structure using the template editor
   - Save your template

2. **Use a Custom Template**:
   - When creating a new project, select "Custom Template" from the framework dropdown
   - Choose your saved template from the template selector
   - Add source context and generate content as usual

### Template Structure

Custom templates use a simple markup language to define the structure:

```
# {{title}}

## Introduction
{{introduction}}

## Main Content
{{mainContent}}

## Conclusion
{{conclusion}}

## References
{{references}}
```

Placeholders ({{placeholder}}) will be replaced with generated content during the generation process.

### Examples

#### Blog Post Template
```
# {{blogTitle}}

Published on {{publishDate}}

## Introduction
{{introduction}}

## Main Points
{{mainPoints}}

## Conclusion
{{conclusion}}

*Originally published on {{blogName}}*
```

#### Technical Documentation Template
```
# {{documentTitle}}

## Overview
{{overview}}

## Installation
{{installation}}

## Usage
{{usage}}

## API Reference
{{apiReference}}

## Troubleshooting
{{troubleshooting}}

## Changelog
{{changelog}}
```
```

## Security

### Reporting Security Issues

If you discover a security vulnerability, please send an email to [security@fayeblade.dev](mailto:security@fayeblade.dev) instead of using the public issue tracker.

Please include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

### Security Best Practices

Contributors should follow these security best practices:

1. **Input Validation**: Always validate and sanitize user inputs
2. **Authentication**: Implement proper authentication and authorization
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Dependencies**: Keep dependencies up to date and audit for vulnerabilities
5. **Secrets Management**: Never commit secrets or API keys to the repository
6. **Secure Coding**: Follow secure coding practices to prevent common vulnerabilities

#### Example Secure Code

```javascript
// backend/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError } = require('./errorService');

class AuthService {
  /**
   * Hash a password securely
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare plain text password with hashed password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Whether passwords match
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT token
   */
  generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: expiresIn,
      issuer: 'deeper-research-synthetic',
      audience: 'ironclad-users'
    });
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {ValidationError} If password is too weak
   */
  validatePasswordStrength(password) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }
  }
}

module.exports = new AuthService();
```

## Community

### Communication Channels

1. **GitHub Issues**: For bug reports and feature requests
2. **GitHub Discussions**: For general discussions and Q&A
3. **Slack/Discord**: Real-time chat (if available)
4. **Email**: [security@fayeblade.dev](mailto:security@fayeblade.dev)

### Recognition

Contributors are recognized in:

1. **GitHub Contributors List**
2. **Project Documentation**
3. **Release Notes**
4. **Social Media Announcements**

### Code Reviews

All contributions require code review by at least one maintainer. During reviews, we focus on:

1. **Code Quality**: Following established patterns and best practices
2. **Functionality**: Meeting requirements and working as expected
3. **Security**: Identifying potential vulnerabilities
4. **Performance**: Ensuring efficient implementation
5. **Maintainability**: Writing clean, understandable code
6. **Test Coverage**: Adequate testing of new functionality

### Becoming a Maintainer

Active contributors who consistently provide high-quality contributions may be invited to become maintainers. Responsibilities include:

1. **Code Reviews**: Reviewing pull requests from other contributors
2. **Issue Management**: Triaging and responding to issues
3. **Documentation**: Keeping documentation up to date
4. **Community Support**: Helping other contributors and users
5. **Release Management**: Preparing and publishing releases

## License

By contributing to Deeper Research Synthetic, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

This CONTRIBUTING.md file provides comprehensive guidelines for contributing to the Deeper Research Synthetic project. It covers everything from setting up the development environment to submitting pull requests, with detailed examples and best practices for code quality, testing, and documentation.