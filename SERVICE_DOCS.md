# Deeper Research Synthetic - Backend Services Documentation

## Table of Contents
1. [Overview](#overview)
2. [Service Architecture](#service-architecture)
3. [Framework Service](#framework-service)
   - [Purpose](#purpose)
   - [Methods](#methods)
   - [Usage Examples](#usage-examples)
4. [Generation Service](#generation-service)
   - [Purpose](#purpose-1)
   - [Methods](#methods-1)
   - [Usage Examples](#usage-examples-1)
5. [Validation Service](#validation-service)
   - [Purpose](#purpose-2)
   - [Methods](#methods-2)
   - [Usage Examples](#usage-examples-2)
6. [Configuration](#configuration)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Performance Considerations](#performance-considerations)

## Overview

This documentation provides a comprehensive guide to the backend services of the Deeper Research Synthetic project. The backend services are responsible for managing content frameworks, orchestrating AI content generation, and validating generated output according to framework-specific requirements.

## Service Architecture

The backend services follow a modular architecture with clear separation of concerns:

```
services/
├── frameworkService.js    # Manages framework prompts and metadata
├── generationService.js   # Orchestrates content generation process
└── validationService.js   # Validates generated output
```

Each service is designed to be independent and focused on a specific responsibility, with well-defined interfaces for communication between services.

## Framework Service

### Purpose

The Framework Service is responsible for managing the three content frameworks (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK) and their associated prompts. It loads framework prompts from the file system, constructs full prompts for generation, and provides framework metadata.

### Methods

#### `loadFrameworkPrompt(frameworkType)`
Loads the framework prompt for a given framework type from the file system.

**Parameters:**
- `frameworkType` (string): The framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)

**Returns:**
- Promise&lt;string&gt;: The framework prompt content

**Throws:**
- Error: If the framework type is unknown or the prompt file cannot be loaded

#### `constructPrompt(frameworkType, sourceContext, userQuery)`
Constructs a full prompt by combining the framework prompt with source context and user query.

**Parameters:**
- `frameworkType` (string): The framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)
- `sourceContext` (string): User-provided source material
- `userQuery` (string, optional): Optional user query/instructions

**Returns:**
- Promise&lt;string&gt;: The complete prompt for AI generation

#### `getFrameworkMetadata(frameworkType)`
Retrieves metadata for a given framework type.

**Parameters:**
- `frameworkType` (string): The framework type (PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK)

**Returns:**
- Object: Framework metadata including name, outputType, and minimum word count

#### `isValidFramework(frameworkType)`
Validates if a framework type is supported.

**Parameters:**
- `frameworkType` (string): The framework type to validate

**Returns:**
- boolean: True if the framework type is valid, false otherwise

### Usage Examples

```javascript
const { loadFrameworkPrompt, constructPrompt, getFrameworkMetadata } = require('./services/frameworkService');

// Load a framework prompt
const deepdivePrompt = await loadFrameworkPrompt('PROJECT_DEEPDIVE');

// Construct a full prompt
const fullPrompt = await constructPrompt('PROJECT_DEEPDIVE', 'Climate change affects the planet in many ways...', 'Focus on impacts to coastal cities');

// Get framework metadata
const frameworkMeta = getFrameworkMetadata('PROJECT_DEEPDIVE');
console.log(frameworkMeta.minWords); // 10000
```

## Generation Service

### Purpose

The Generation Service orchestrates the content generation process using the Gemini AI API. It tracks generation progress, measures generation time, and integrates with the validation service to ensure output quality.

### Methods

#### `generateContent(project, onProgress)`
Generates content for a project using the Gemini AI API.

**Parameters:**
- `project` (Object): The project object containing framework, sourceContext, and other metadata
- `onProgress` (Function): Callback function for progress updates

**Returns:**
- Promise&lt;Object&gt;: Generation result with content and metadata

**Throws:**
- Error: If generation fails or source context is missing

#### `countWords(text)`
Counts the number of words in a text string.

**Parameters:**
- `text` (string): Text to count words in

**Returns:**
- number: Number of words in the text

#### `estimateTimeRemaining(currentWords, targetWords, elapsedSeconds)`
Estimates the time remaining for generation based on current progress.

**Parameters:**
- `currentWords` (number): Current word count
- `targetWords` (number): Target word count
- `elapsedSeconds` (number): Time elapsed so far in seconds

**Returns:**
- number: Estimated seconds remaining

### Usage Examples

```javascript
const { generateContent } = require('./services/generationService');

// Generate content for a project
const result = await generateContent(
  {
    framework: 'PROJECT_DEEPDIVE',
    sourceContext: 'Artificial intelligence is transforming industries...',
    name: 'AI Impact Analysis'
  },
  (progress) => {
    console.log(`Progress: ${progress.estimatedProgress}%`);
  }
);

console.log(result.content);
console.log(result.metadata.wordCount);
```

## Validation Service

### Purpose

The Validation Service validates generated output against framework-specific requirements. It checks word counts, structure, and other framework elements to ensure the output meets quality standards.

### Methods

#### `validateOutput(content, frameworkType)`
Validates generated output against framework requirements.

**Parameters:**
- `content` (string): Generated content to validate
- `frameworkType` (string): Framework type to validate against

**Returns:**
- Object: Validation result with valid flag, errors, and warnings

### Validation Rules

#### PROJECT_DEEPDIVE
- Minimum 10,000 words
- At least 5 main sections (## headers)
- Citations required ([1], [2], etc.)
- No bullet points
- At least 10 subsections (### headers)

#### PROJECT_SYNTHETIC
- Minimum 15,000 words
- Includes "Good morning" opener
- Includes "data infusion complete" closer
- At least 3 Key Implication sections (**Key Implication:**)

#### PROJECT_BENCHMARK
- Minimum 5,000 words
- Includes DEFCON assessment
- At least 10 data tables
- Citations required ([1], [2], etc.)

### Usage Examples

```javascript
const { validateOutput } = require('./services/validationService');

// Validate generated content
const validation = validateOutput(generatedContent, 'PROJECT_DEEPDIVE');

if (validation.valid) {
  console.log('Content meets framework requirements');
} else {
  console.log('Validation errors:', validation.errors);
  console.log('Validation warnings:', validation.warnings);
}
```

## Configuration

The backend services are configured through environment variables defined in the `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
TEMPERATURE=0.7
TOP_P=0.95
TOP_K=40
MAX_OUTPUT_TOKENS=32000
```

These variables control the behavior of the Gemini AI API and affect the generation process.

## Error Handling

The services implement comprehensive error handling to ensure robust operation:

1. **Framework Loading Errors**: Gracefully handle missing or malformed framework prompt files
2. **Generation Errors**: Catch and report errors during content generation
3. **Validation Errors**: Handle validation failures and report detailed error information
4. **Network Errors**: Handle connection issues with the Gemini API

Error handling follows these principles:
1. All errors are caught and handled appropriately
2. Error messages are descriptive and actionable
3. Errors are logged for debugging purposes
4. Errors are propagated to calling functions when appropriate

## Testing

### Testing Strategy

The backend services should be tested with the following approach:

1. **Unit Tests**: Test individual methods in isolation
2. **Integration Tests**: Test interactions between services
3. **Mock Services**: Mock external dependencies (Gemini API) for testing
4. **Edge Cases**: Test boundary conditions and error scenarios

### Test Coverage Goals

1. Framework Service: 80%+ coverage
2. Generation Service: 75%+ coverage
3. Validation Service: 90%+ coverage

### Example Test Structure

```javascript
// frameworkService.test.js
describe('Framework Service', () => {
  test('loads framework prompt correctly', async () => {
    const prompt = await loadFrameworkPrompt('PROJECT_DEEPDIVE');
    expect(prompt).toContain('DEEPDIVE');
  });

  test('validates framework types correctly', () => {
    expect(isValidFramework('PROJECT_DEEPDIVE')).toBe(true);
    expect(isValidFramework('INVALID_FRAMEWORK')).toBe(false);
  });
});
```

## Performance Considerations

1. **Memory Usage**: Services are designed to minimize memory footprint by streaming content rather than buffering large amounts of text
2. **Asynchronous Operations**: All long-running operations are asynchronous to prevent blocking the event loop
3. **Caching**: Framework prompts are loaded once and cached for reuse
4. **Streaming**: Content generation uses streaming to provide real-time updates without buffering
5. **Resource Cleanup**: Resources are properly cleaned up after use to prevent memory leaks

This documentation provides a comprehensive guide to the backend services of the Deeper Research Synthetic project. Developers should refer to this document when working with the services or implementing new features.