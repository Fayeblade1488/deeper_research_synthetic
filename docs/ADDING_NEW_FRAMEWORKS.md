# Adding New Frameworks to Deeper Research Synthetic

## Overview

This guide provides step-by-step instructions for adding new content frameworks to the Deeper Research Synthetic project. Frameworks define the structure, requirements, and validation rules for different types of generated content.

## Table of Contents

1. [Understanding Frameworks](#understanding-frameworks)
2. [Framework Components](#framework-components)
3. [Step-by-Step Guide](#step-by-step-guide)
   - [1. Define the Framework](#1-define-the-framework)
   - [2. Create Prompt Templates](#2-create-prompt-templates)
   - [3. Implement Validation Rules](#3-implement-validation-rules)
   - [4. Update the Frontend](#4-update-the-frontend)
   - [5. Testing](#5-testing)
4. [Best Practices](#best-practices)
5. [Example: Adding a New Framework](#example-adding-a-new-framework)

## Understanding Frameworks

Frameworks in Deeper Research Synthetic define:
1. The structure and format of the generated content
2. Minimum requirements (word count, sections, etc.)
3. Validation rules to ensure quality output
4. UI layout for the frontend application

Each framework corresponds to a specific type of content and has its own set of requirements and validation rules.

## Framework Components

Each framework consists of the following components:

1. **Framework Definition**: Metadata about the framework including name, type, and requirements
2. **Prompt Template**: The base prompt that guides the AI generation
3. **Validation Rules**: Rules to validate the generated output
4. **Frontend Layout**: UI layout for the framework in the frontend application

## Step-by-Step Guide

### 1. Define the Framework

First, define the new framework in `backend/services/frameworkService.js`:

```javascript
const FRAMEWORK_TYPES = {
  PROJECT_DEEPDIVE: {
    name: 'PROJECT_DEEPDIVE',
    outputType: 'TOME',
    promptFile: 'research_frameworks/deeper_research_framework.txt',
    minWords: 10000,
    description: 'Exhaustive academic-style white paper',
  },
  PROJECT_SYNTHETIC: {
    name: 'PROJECT_SYNTHETIC',
    outputType: 'TRANSMISSION',
    promptFile: 'podcast_synthetics/podcast-synthetic-template.md',
    minWords: 15000,
    description: 'Narrative-driven podcast episode script',
  },
  PROJECT_BENCHMARK: {
    name: 'PROJECT_BENCHMARK',
    outputType: 'SNAPSHOT',
    promptFile: 'benchmarks/human-condition-benchmark-framework.txt',
    minWords: 5000,
    description: 'Data-driven crisis dashboard with DEFCON assessment',
  },
  // Add your new framework here
  PROJECT_YOURNEWFRAMEWORK: {
    name: 'PROJECT_YOURNEWFRAMEWORK',
    outputType: 'YOUR_OUTPUT_TYPE',
    promptFile: 'your_new_framework/your-framework-template.txt',
    minWords: 5000, // Adjust as needed
    description: 'Description of your new framework',
  },
};
```

### 2. Create Prompt Templates

Create the prompt template files in the `data/frameworks/` directory:

1. Create a new directory for your framework:
   ```
   data/frameworks/
   └── your_new_framework/
       └── your-framework-template.txt
   ```

2. Write the prompt template with clear instructions for the AI:

```
# YOUR FRAMEWORK TEMPLATE

## Instructions for the AI

You are to generate content in the following format:

1. Title: A compelling title that captures the essence of the content
2. Introduction: Brief overview of the topic
3. Section 1: First main section with detailed analysis
4. Section 2: Second main section with supporting information
5. Conclusion: Summary of key points and implications
6. References: Citations in [1], [2] format

## Requirements

- Total word count: MIN_WORDS+ words
- Use clear, concise language
- Include at least 5 citations
- Follow the specified section structure
- Maintain an objective, analytical tone

## Formatting Guidelines

- Use markdown formatting
- Headers: # for title, ## for main sections, ### for subsections
- Emphasis: **bold** for key terms
- Citations: [1], [2] in brackets
- Lists: Use numbered lists for ordered information

## Topic Instructions

Generate content based on the provided source context.

[END OF FRAMEWORK INSTRUCTIONS]
```

### 3. Implement Validation Rules

Add validation rules for your new framework in `backend/services/validationService.js`:

```javascript
function validateOutput(content, frameworkType) {
  const framework = getFrameworkMetadata(frameworkType);
  
  if (!framework) {
    return {
      valid: false,
      errors: ['Invalid framework type'],
      warnings: [],
    };
  }
  
  const errors = [];
  const warnings = [];
  
  // Word count validation
  const wordCount = countWords(content);
  if (wordCount < framework.minWords) {
    errors.push(`Word count ${wordCount} is below minimum ${framework.minWords}`);
  } else if (wordCount < framework.minWords * 1.2) {
    warnings.push(`Word count ${wordCount} is close to minimum ${framework.minWords}`);
  }
  
  // Framework-specific validation
  switch (frameworkType) {
    case 'PROJECT_DEEPDIVE':
      validateDeepdive(content, errors, warnings);
      break;
    case 'PROJECT_SYNTHETIC':
      validateSynthetic(content, errors, warnings);
      break;
    case 'PROJECT_BENCHMARK':
      validateBenchmark(content, errors, warnings);
      break;
    // Add your new framework validation here
    case 'PROJECT_YOURNEWFRAMEWORK':
      validateYourNewFramework(content, errors, warnings);
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    wordCount,
  };
}

// Add your new framework validation function
function validateYourNewFramework(content, errors, warnings) {
  // Check for title (# header)
  if (!content.match(/^#\s+.+$/m)) {
    errors.push('Missing title (# header)');
  }
  
  // Check for main sections (## headers)
  const mainSections = content.match(/^##\s+.+$/gm);
  if (!mainSections || mainSections.length < 5) {
    errors.push(`Found ${mainSections?.length || 0} main sections, need at least 5`);
  }
  
  // Check for subsections (### headers)
  const subsections = content.match(/^###\s+.+$/gm);
  if (!subsections || subsections.length < 10) {
    warnings.push(`Found ${subsections?.length || 0} subsections, consider adding more detail`);
  }
  
  // Check for citations
  if (!content.match(/\[\d+\]/)) {
    warnings.push('No citations found - ensure sources are cited');
  }
  
  // Add any additional validation rules specific to your framework
}
```

### 4. Update the Frontend

Update the frontend to support the new framework:

1. Add the framework to the project creation form in `frontend/src/components/NewProjectForm.jsx`:

```jsx
<select>
  <option value="PROJECT_DEEPDIVE">PROJECT DEEPDIVE (TOME)</option>
  <option value="PROJECT_SYNTHETIC">PROJECT SYNTHETIC (TRANSMISSION)</option>
  <option value="PROJECT_BENCHMARK">PROJECT BENCHMARK (SNAPSHOT)</option>
  {/* Add your new framework option */}
  <option value="PROJECT_YOURNEWFRAMEWORK">PROJECT YOURNEWFRAMEWORK (YOUR_OUTPUT_TYPE)</option>
</select>
```

2. Create a new layout component for your framework in `frontend/src/components/layouts/YourNewFrameworkLayout.jsx`:

```jsx
import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const YourNewFrameworkLayout = ({ project }) => {
  const layout = [
    { i: 'a', x: 0, y: 0, w: 6, h: 8 },
    { i: 'b', x: 6, y: 0, w: 6, h: 8 },
    { i: 'c', x: 0, y: 8, w: 12, h: 6 },
  ];

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
    >
      <div key="a">
        {/* Add your first panel component */}
      </div>
      <div key="b">
        {/* Add your second panel component */}
      </div>
      <div key="c">
        {/* Add your third panel component */}
      </div>
    </ResponsiveGridLayout>
  );
};

export default YourNewFrameworkLayout;
```

3. Update the Workspace component to use your new layout:

```jsx
import YourNewFrameworkLayout from './layouts/YourNewFrameworkLayout';

// In the renderLayout function:
case 'PROJECT_YOURNEWFRAMEWORK':
  return <YourNewFrameworkLayout project={project} />;
```

### 5. Testing

After implementing your new framework, thoroughly test all components:

1. Create a new project with your framework
2. Add source context
3. Generate content
4. Verify validation rules
5. Check frontend display
6. Verify all API endpoints work correctly

## Best Practices

When adding new frameworks, follow these best practices:

1. **Clear Instructions**: Provide clear, unambiguous instructions in your prompt templates
2. **Consistent Formatting**: Use consistent formatting guidelines across all frameworks
3. **Comprehensive Validation**: Implement thorough validation to ensure quality output
4. **User-Friendly UI**: Design intuitive layouts for your framework in the frontend
5. **Documentation**: Document your framework clearly with examples and guidelines
6. **Testing**: Thoroughly test all components of your new framework
7. **Performance**: Consider the computational requirements of your framework
8. **Scalability**: Design frameworks that can scale with increased demand

## Example: Adding a New Framework

Let's walk through adding a new framework called "PROJECT_EXECUTIVE" that generates executive summaries.

### 1. Define the Framework

In `backend/services/frameworkService.js`:

```javascript
PROJECT_EXECUTIVE: {
  name: 'PROJECT_EXECUTIVE',
  outputType: 'EXECUTIVE_SUMMARY',
  promptFile: 'executive_summaries/executive-summary-template.txt',
  minWords: 2500,
  description: 'Concise executive summary with key findings and recommendations',
}
```

### 2. Create Prompt Template

Create `data/frameworks/executive_summaries/executive-summary-template.txt`:

```
# EXECUTIVE SUMMARY TEMPLATE

## Instructions for the AI

You are to generate a concise executive summary that includes:

1. Title: A compelling title that captures the essence
2. Executive Summary: 3-5 paragraph overview of key findings
3. Key Findings: 5-10 bullet points of critical insights
4. Recommendations: 3-5 actionable recommendations
5. Conclusion: Brief conclusion summarizing the importance
6. References: Citations in [1], [2] format

## Requirements

- Total word count: 2500+ words
- Use clear, concise language appropriate for executives
- Include at least 5 citations
- Focus on key findings and recommendations
- Maintain an objective, analytical tone

## Formatting Guidelines

- Use markdown formatting
- Headers: # for title, ## for main sections
- Bullet points: - for key findings and recommendations
- Citations: [1], [2] in brackets
- Emphasis: **bold** for key terms

## Topic Instructions

Generate an executive summary based on the provided source context.

[END OF EXECUTIVE SUMMARY INSTRUCTIONS]
```

### 3. Implement Validation Rules

In `backend/services/validationService.js`:

```javascript
function validateExecutive(content, errors, warnings) {
  // Check for title (# header)
  if (!content.match(/^#\s+.+$/m)) {
    errors.push('Missing title (# header)');
  }
  
  // Check for main sections (## headers)
  const mainSections = content.match(/^##\s+.+$/gm);
  if (!mainSections || mainSections.length < 5) {
    errors.push(`Found ${mainSections?.length || 0} main sections, need at least 5`);
  }
  
  // Check for key findings (bullet points)
  const bulletPoints = content.match(/^\s*-\s+.+$/gm);
  if (!bulletPoints || bulletPoints.length < 10) {
    warnings.push(`Found ${bulletPoints?.length || 0} bullet points, consider adding more key findings`);
  }
  
  // Check for citations
  if (!content.match(/\[\d+\]/)) {
    warnings.push('No citations found - ensure sources are cited');
  }
}
```

### 4. Update the Frontend

Update the project creation form and add a new layout component for the executive summary framework.

This comprehensive guide should help you successfully add new frameworks to the Deeper Research Synthetic project. Remember to thoroughly test all components and document your changes for future maintenance.