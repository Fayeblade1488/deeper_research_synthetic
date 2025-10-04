# Testing Guide for Deeper Research Synthetic

## Overview

This guide provides comprehensive instructions for testing the Deeper Research Synthetic project. It covers testing strategies, tools, and best practices for ensuring the quality and reliability of the application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Testing Tools](#testing-tools)
3. [Backend Testing](#backend-testing)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [API Testing](#api-testing)
4. [Frontend Testing](#frontend-testing)
   - [Component Testing](#component-testing)
   - [Integration Testing](#frontend-integration-testing)
   - [End-to-End Testing](#end-to-end-testing)
5. [Test Coverage Goals](#test-coverage-goals)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Continuous Integration](#continuous-integration)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)

## Testing Strategy

The testing strategy for Deeper Research Synthetic follows a pyramid approach:

1. **Unit Tests** (70%): Test individual functions and components in isolation
2. **Integration Tests** (20%): Test interactions between components and services
3. **End-to-End Tests** (10%): Test critical user flows from start to finish

### Testing Principles

1. **Fast Feedback**: Tests should run quickly to provide immediate feedback
2. **Reliable**: Tests should produce consistent results
3. **Maintainable**: Tests should be easy to update when the code changes
4. **Clear**: Test names and assertions should clearly describe what is being tested
5. **Focused**: Each test should focus on a single behavior or scenario

## Testing Tools

### Backend Testing Tools

1. **Jest**: JavaScript testing framework for unit and integration tests
2. **Supertest**: HTTP assertions for API testing
3. **Nock**: HTTP mocking for external API calls

### Frontend Testing Tools

1. **Jest**: JavaScript testing framework for unit tests
2. **React Testing Library**: Lightweight solution for testing React components
3. **Cypress**: End-to-end testing framework
4. **Playwright**: Cross-browser end-to-end testing framework

## Backend Testing

### Unit Testing

Unit tests focus on individual functions and modules without external dependencies.

#### Framework Service Testing

```javascript
// backend/tests/unit/frameworkService.test.js
const { loadFrameworkPrompt, constructPrompt, isValidFramework } = require('../../services/frameworkService');

describe('Framework Service', () => {
  test('loads framework prompt correctly', async () => {
    const prompt = await loadFrameworkPrompt('PROJECT_DEEPDIVE');
    expect(prompt).toContain('DEEPDIVE');
  });

  test('validates framework types correctly', () => {
    expect(isValidFramework('PROJECT_DEEPDIVE')).toBe(true);
    expect(isValidFramework('INVALID_FRAMEWORK')).toBe(false);
  });

  test('constructs prompt with source context', async () => {
    const prompt = await constructPrompt('PROJECT_DEEPDIVE', 'Climate change affects the planet in many ways...');
    expect(prompt).toContain('Climate change affects the planet in many ways...');
  });
});
```

#### Generation Service Testing

```javascript
// backend/tests/unit/generationService.test.js
const { countWords, estimateTimeRemaining } = require('../../services/generationService');

describe('Generation Service', () => {
  test('counts words correctly', () => {
    expect(countWords('This is a test')).toBe(4);
    expect(countWords('')).toBe(0);
  });

  test('estimates time remaining correctly', () => {
    const remaining = estimateTimeRemaining(5000, 10000, 30);
    expect(remaining).toBeGreaterThan(0);
  });
});
```

#### Validation Service Testing

```javascript
// backend/tests/unit/validationService.test.js
const { validateOutput } = require('../../services/validationService');

describe('Validation Service', () => {
  test('validates deepdive content', () => {
    const content = '# Title\n\n## Section 1\n\nContent [1]\n\n## Section 2\n\nMore content';
    const result = validateOutput(content, 'PROJECT_DEEPDIVE');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Word count');
  });

  test('identifies validation errors', () => {
    const content = 'Too short';
    const result = validateOutput(content, 'PROJECT_DEEPDIVE');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Word count');
  });
});
```

### Integration Testing

Integration tests verify that different parts of the backend work together correctly.

#### API Route Testing

```javascript
// backend/tests/integration/api.test.js
const request = require('supertest');
const app = require('../../server');

describe('API Integration Tests', () => {
  test('creates a project successfully', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE'
      })
      .expect(201);

    expect(response.body.name).toBe('Test Project');
    expect(response.body.framework).toBe('PROJECT_DEEPDIVE');
  });

  test('retrieves all projects', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('handles missing project', async () => {
    await request(app)
      .get('/api/projects/invalid-id')
      .expect(404);
  });
});
```

### API Testing

API tests verify that all endpoints work as expected.

#### Testing with Supertest

```javascript
// backend/tests/api/projects.test.js
const request = require('supertest');
const app = require('../../server');

describe('Project API', () => {
  let projectId;

  test('POST /api/projects creates a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        framework: 'PROJECT_DEEPDIVE'
      })
      .expect(201);

    projectId = response.body.id;
    expect(response.body.name).toBe('Test Project');
  });

  test('GET /api/projects retrieves all projects', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  test('GET /api/projects/:id retrieves a specific project', async () => {
    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(response.body.id).toBe(projectId);
  });

  test('PUT /api/projects/:id updates a project', async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .send({
        sourceContext: 'Updated source context'
      })
      .expect(200);

    expect(response.body.sourceContext).toBe('Updated source context');
  });

  test('DELETE /api/projects/:id deletes a project', async () => {
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .expect(204);
  });
});
```

## Frontend Testing

### Component Testing

Component tests verify that individual React components render correctly and handle user interactions.

#### Testing with React Testing Library

```javascript
// frontend/tests/components/SourcePanel.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SourcePanel from '../../src/components/panels/SourcePanel';

describe('SourcePanel Component', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    framework: 'PROJECT_DEEPDIVE',
    sourceContext: '',
  };

  test('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SourcePanel project={mockProject} />
    );

    expect(getByText('Source Context')).toBeInTheDocument();
    expect(getByPlaceholderText('Paste your source material here...')).toBeInTheDocument();
  });

  test('calls update function when text changes', () => {
    const mockUpdate = jest.fn();
    const { getByPlaceholderText } = render(
      <SourcePanel project={mockProject} onUpdateContext={mockUpdate} />
    );

    const textarea = getByPlaceholderText('Paste your source material here...');
    fireEvent.change(textarea, { target: { value: 'New source context' } });

    // Note: This assumes the component calls onUpdateContext on change
    // You may need to adjust this based on your actual implementation
  });
});
```

### Frontend Integration Testing

Frontend integration tests verify that components work together correctly and interact with the backend API.

#### Testing API Service

```javascript
// frontend/tests/services/apiService.test.js
import { fetchProjects, createProject } from '../../src/services/apiService';

describe('API Service', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('fetches projects successfully', async () => {
    fetch.mockResponseOnce(JSON.stringify([{ id: '1', name: 'Test Project' }]));

    const projects = await fetchProjects();
    
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Test Project');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/projects');
  });

  test('creates a project successfully', async () => {
    const newProject = { id: '1', name: 'Test Project', framework: 'PROJECT_DEEPDIVE' };
    fetch.mockResponseOnce(JSON.stringify(newProject));

    const project = await createProject('Test Project', 'PROJECT_DEEPDIVE');
    
    expect(project.name).toBe('Test Project');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/projects', expect.any(Object));
  });
});
```

### End-to-End Testing

End-to-end tests verify critical user flows from start to finish.

#### Testing with Cypress

```javascript
// frontend/tests/e2e/projectManagement.test.js
describe('Project Management', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('allows creating a new project', () => {
    cy.contains('New Project').click();
    
    cy.get('[data-testid="project-name-input"]').type('Test Project');
    cy.get('[data-testid="framework-select"]').select('PROJECT_DEEPDIVE');
    cy.get('[data-testid="create-project-button"]').click();
    
    cy.contains('Test Project').should('be.visible');
  });

  it('allows adding source context', () => {
    // Select an existing project or create one first
    cy.contains('Test Project').click();
    
    cy.get('[data-testid="source-context-textarea"]')
      .type('This is test source context for the project.');
    
    // Verify the text was entered
    cy.get('[data-testid="source-context-textarea"]')
      .should('have.value', 'This is test source context for the project.');
  });

  it('allows deleting a project', () => {
    cy.contains('Test Project').click();
    
    cy.get('[data-testid="delete-project-button"]').click();
    
    // Confirm deletion if there's a confirmation dialog
    cy.on('window:confirm', () => true);
    
    cy.contains('Test Project').should('not.exist');
  });
});
```

## Test Coverage Goals

### Backend Coverage Goals

1. **Framework Service**: 80%+ coverage
2. **Generation Service**: 75%+ coverage
3. **Validation Service**: 90%+ coverage
4. **API Routes**: 100% coverage for success and error cases

### Frontend Coverage Goals

1. **Components**: 70%+ coverage for critical paths
2. **Services**: 80%+ coverage
3. **Utilities**: 90%+ coverage

## Writing Tests

### Test Structure

Follow this structure for all tests:

```javascript
describe('Component/Service Name', () => {
  // Setup code that runs before each test
  beforeEach(() => {
    // Reset mocks, initialize components, etc.
  });

  // Teardown code that runs after each test
  afterEach(() => {
    // Clean up resources, reset state, etc.
  });

  test('should do something specific', () => {
    // Arrange: Set up the test data and conditions
    const inputData = 'test input';
    
    // Act: Call the function or simulate user interaction
    const result = someFunction(inputData);
    
    // Assert: Verify the result matches expectations
    expect(result).toBe('expected output');
  });
});
```

### Naming Conventions

1. Use descriptive test names that clearly state what is being tested
2. Follow the "should" convention for test descriptions
3. Use consistent naming patterns across the codebase

### Mocking External Dependencies

When testing, mock external dependencies to isolate the code under test:

```javascript
// Mocking an external API call
jest.mock('../../services/apiService', () => ({
  fetchProjects: jest.fn(),
  createProject: jest.fn(),
}));

// Mocking environment variables
process.env.GEMINI_API_KEY = 'test-key';
```

## Running Tests

### Backend Tests

Run all backend tests:
```bash
cd backend
npm test
```

Run tests with coverage:
```bash
cd backend
npm run test:coverage
```

Run specific test files:
```bash
cd backend
npm test tests/unit/frameworkService.test.js
```

### Frontend Tests

Run all frontend tests:
```bash
cd frontend
npm test
```

Run tests in watch mode:
```bash
cd frontend
npm run test:watch
```

Run tests with coverage:
```bash
cd frontend
npm run test:coverage
```

### End-to-End Tests

Run end-to-end tests:
```bash
cd frontend
npm run test:e2e
```

## Continuous Integration

### GitHub Actions Workflow

Create a `.github/workflows/test.yml` file:

```yaml
name: Run Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [14.x, 16.x]
        
    steps:
    - uses: actions/checkout@v2
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
        
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
        
    - name: Run backend tests
      run: |
        cd backend
        npm test
        
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run frontend tests
      run: |
        cd frontend
        npm test
        
    - name: Run end-to-end tests
      run: |
        cd frontend
        npm run test:e2e
```

## Performance Testing

### Load Testing

Use tools like Artillery or k6 to test the performance of API endpoints:

```yaml
# artillery.yml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      content-type: "application/json"

scenarios:
  - flow:
    - post:
        url: "/api/projects"
        json:
          name: "Load Test Project"
          framework: "PROJECT_DEEPDIVE"
    - get:
        url: "/api/projects"
```

Run the load test:
```bash
artillery run artillery.yml
```

### Stress Testing

Use stress testing to determine the breaking point of the application:

```javascript
// stress-test.js
const http = require('k6/http');
const { check } = require('k6');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const payload = JSON.stringify({
    name: 'Stress Test Project',
    framework: 'PROJECT_DEEPDIVE',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3001/api/projects', payload, params);

  check(res, {
    'status was 201': (r) => r.status == 201,
  });
}
```

Run the stress test:
```bash
k6 run stress-test.js
```

## Security Testing

### API Security Testing

Test for common security vulnerabilities:

1. **Input Validation**: Ensure all inputs are properly validated
2. **Injection Attacks**: Test for injection vulnerabilities
3. **Authentication**: Verify authentication mechanisms work correctly
4. **Authorization**: Ensure users can only access authorized resources
5. **Rate Limiting**: Test rate limiting to prevent abuse

### OWASP Top 10 Testing

Ensure the application is protected against the OWASP Top 10 security risks:

1. **Injection**: Test for SQL, NoSQL, OS, and LDAP injection
2. **Broken Authentication**: Verify authentication mechanisms
3. **Sensitive Data Exposure**: Ensure sensitive data is properly protected
4. **XML External Entities (XXE)**: Test XML parsers for XXE vulnerabilities
5. **Broken Access Control**: Verify proper access controls are in place
6. **Security Misconfiguration**: Ensure proper security configuration
7. **Cross-Site Scripting (XSS)**: Test for XSS vulnerabilities in the frontend
8. **Insecure Deserialization**: Test for insecure deserialization vulnerabilities
9. **Using Components with Known Vulnerabilities**: Regularly scan dependencies
10. **Insufficient Logging & Monitoring**: Ensure proper logging and monitoring

This comprehensive testing guide should help ensure the quality, reliability, and security of the Deeper Research Synthetic project. Regular testing should be performed as part of the development process to catch issues early and maintain high code quality.