/**
 * @file Validation service unit tests
 * @description Unit tests for the ValidationService functions
 */

const { 
  validateOutput, 
  countWords,
  safeMatch
} = require('../../../services/validationService');

describe('ValidationService', () => {
  describe('validateOutput', () => {
    it('should validate PROJECT_DEEPDIVE content correctly', async () => {
      const content = `
# Test Research Paper

## Introduction
This is the introduction section with sufficient content to meet requirements.

## Literature Review
This section reviews existing literature on the topic.

### Subsection 1
Detailed analysis of previous work.

### Subsection 2
Another detailed subsection.

## Methodology
This section describes the research methodology.

### Data Collection
Details about data collection process.

### Analysis Techniques
Explanation of analysis techniques used.

## Results
Presentation of research findings.

### Statistical Analysis
Statistical results and interpretations.

### Visual Representations
Charts and graphs showing results.

## Discussion
Interpretation of results and their implications.

## Conclusion
Summary of findings and future work.

## References
1. Author A. (2023). Research Paper 1.
2. Author B. (2022). Research Paper 2.
`;

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: [
          'Found bullet points - framework prefers flowing paragraphs',
          'No proper citations found - ensure sources are cited at sentence ends'
        ],
        wordCount: expect.any(Number) // Actual count may vary
      });
      
      // Verify word count is reasonable
      expect(result.wordCount).toBeGreaterThan(100);
    });

    it('should validate PROJECT_SYNTHETIC content correctly', async () => {
      const content = `
Good morning, and welcome to today's episode.

## Introduction
This is the introduction to our podcast episode.

### Key Point 1
First important point discussed.

**Key Implication:** This has significant implications for our understanding.

### Key Point 2
Second important point discussed.

**Key Implication:** This also has important implications.

## Main Content
The core content of our episode.

### Story Segment 1
Narrative storytelling segment.

**Key Implication:** This reveals important insights.

### Story Segment 2
Another narrative segment.

**Key Implication:** This offers additional perspectives.

## Conclusion
Wrapping up our discussion.

Data infusion complete.
`;

      const result = await validateOutput(content, 'PROJECT_SYNTHETIC');

      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: [
          'No proper citations found - ensure sources are cited at sentence ends'
        ],
        wordCount: expect.any(Number) // Actual count may vary
      });
      
      // Verify word count is reasonable
      expect(result.wordCount).toBeGreaterThan(100);
    });

    it('should validate PROJECT_BENCHMARK content correctly', async () => {
      const content = `
# Risk Assessment Report

## Executive Summary
Summary of key findings.

## DEFCON Level Assessment
Current risk level: DEFCON 3

## Data Analysis
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Risk Factor A | 7.2 | 8.0 | GREEN |
| Risk Factor B | 9.1 | 8.5 | RED |
| Risk Factor C | 5.5 | 6.0 | YELLOW |

### Additional Metrics
| Category | Score | Rating |
|----------|-------|--------|
| Metric 1 | 85 | HIGH |
| Metric 2 | 72 | MEDIUM |
| Metric 3 | 91 | CRITICAL |
| Metric 4 | 68 | MEDIUM |
| Metric 5 | 79 | HIGH |
| Metric 6 | 88 | HIGH |
| Metric 7 | 95 | CRITICAL |
| Metric 8 | 73 | MEDIUM |
| Metric 9 | 82 | HIGH |
| Metric 10 | 89 | HIGH |

## Recommendations
Based on the analysis, we recommend the following actions.

## Conclusion
Summary and next steps.

## References
1. Risk Assessment Framework, 2023.
2. Security Metrics Standards, 2022.
`;

      const result = await validateOutput(content, 'PROJECT_BENCHMARK');

      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: [
          'No proper citations found - ensure sources are cited at sentence ends'
        ],
        wordCount: expect.any(Number) // Actual count may vary
      });
      
      // Verify word count is reasonable
      expect(result.wordCount).toBeGreaterThan(100);
    });

    it('should detect validation errors for insufficient content', async () => {
      const content = '# Too Short\n\nThis content is far too short.';

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Word count 8 is below minimum 10000');
    });

    it('should detect validation errors for missing framework elements', async () => {
      const content = '# Test Content\n\nJust a simple test.';

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing title (# header)');
      expect(result.errors).toContain('Found 0 main sections, need at least 5');
    });

    it('should handle invalid framework type', async () => {
      const content = '# Test Content\n\nJust a simple test.';

      const result = await validateOutput(content, 'INVALID_FRAMEWORK');

      expect(result).toEqual({
        valid: false,
        errors: ['Invalid framework type'],
        warnings: [],
        wordCount: 7
      });
    });

    it('should handle empty content', async () => {
      const content = '';

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content is empty');
      expect(result.wordCount).toBe(0);
    });

    it('should handle null content', async () => {
      const result = await validateOutput(null, 'PROJECT_DEEPDIVE');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content is empty');
      expect(result.wordCount).toBe(0);
    });

    it('should handle undefined content', async () => {
      const result = await validateOutput(undefined, 'PROJECT_DEEPDIVE');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content is empty');
      expect(result.wordCount).toBe(0);
    });

    it('should validate content with excessive bullet points', async () => {
      let content = '# Test Content\n\n';
      for (let i = 0; i < 50; i++) {
        content += `- Bullet point ${i}\n`;
      }

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result.warnings).toContain('Found excessive bullet points (50) - framework prefers flowing paragraphs');
    });

    it('should validate content with proper citations', async () => {
      const content = `
# Test Paper

This is a sentence with a proper citation at the end. [1]

## Section
Another sentence with citation. [2]

### Subsection
Final sentence with citation. [3]

## References
[1] Author A. (2023). Paper 1.
[2] Author B. (2022). Paper 2.
[3] Author C. (2021). Paper 3.
`;

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      // Should not have citation warning since we have proper citations
      expect(result.warnings).not.toContain('No proper citations found - ensure sources are cited at sentence ends');
    });

    it('should validate content with improper citations', async () => {
      const content = `
# Test Paper

This is a sentence with improper citation [1, 2, 3].

## Section
Another sentence without proper citation format.

### Subsection
Final sentence with citation in middle [4] of sentence.

## References
[1] Author A. (2023). Paper 1.
[2] Author B. (2022). Paper 2.
[3] Author C. (2021). Paper 3.
[4] Author D. (2020). Paper 4.
`;

      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      // Should have citation warning since citations are not at sentence ends
      expect(result.warnings).toContain('No proper citations found - ensure sources are cited at sentence ends');
    });

    it('should validate PROJECT_SYNTHETIC content with proper opener and closer', async () => {
      const content = `
Good morning, welcome to the show.

## Introduction
This is the introduction.

### Key Point
Important point.

**Key Implication:** This has implications.

## Main Content
The core of our episode.

### Story Segment
A narrative story.

**Key Implication:** This reveals insights.

## Conclusion
Wrapping up.

Data infusion complete.
`;

      const result = await validateOutput(content, 'PROJECT_SYNTHETIC');

      // Should not have opener/closer warnings since they're present
      expect(result.warnings).not.toContain('Missing standard opener format');
      expect(result.warnings).not.toContain('Missing standard closer phrase');
    });

    it('should validate PROJECT_BENCHMARK content with DEFCON assessment', async () => {
      const content = `
# Risk Assessment

## DEFCON Level Assessment
Current risk level: DEFCON 2

## Data Analysis
| Metric | Value |
|--------|-------|
| Risk A | 8.5   |
| Risk B | 7.2   |

## Recommendations
Recommended actions.
`;

      const result = await validateOutput(content, 'PROJECT_BENCHMARK');

      // Should not have DEFCON warning since it's present
      expect(result.errors).not.toContain('Missing DEFCON crisis assessment');
    });

    it('should validate PROJECT_BENCHMARK content with sufficient data tables', async () => {
      let content = '# Risk Assessment\n\n';
      
      // Add 10 data tables
      for (let i = 1; i <= 10; i++) {
        content += `
Table ${i}
| Col A | Col B |
|-------|-------|
| Val 1 | Val 2 |
`;
      }

      const result = await validateOutput(content, 'PROJECT_BENCHMARK');

      // Should not have table warning since we have sufficient tables
      expect(result.errors).not.toContain('Missing required data tables');
    });

    it('should handle timeout errors gracefully', async () => {
      // Mock a regex that will timeout
      const originalSafeMatch = safeMatch;
      
      // Restore after test
      safeMatch.mockImplementation(async (text, pattern, timeoutMs = 1000) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Regex timeout - potential ReDoS attack'));
          }, 10); // Very short timeout for testing
          
          try {
            const result = text.match(pattern);
            clearTimeout(timeout);
            resolve(result);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });

      const content = '# Test\n\nContent.';
      const result = await validateOutput(content, 'PROJECT_DEEPDIVE');

      expect(result.warnings).toContain('Validation timeout - content may contain patterns causing excessive processing time');

      // Restore original
      safeMatch.mockRestore();
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const text = 'This is a test with seven words.';
      const count = countWords(text);
      
      expect(count).toBe(7);
    });

    it('should handle empty text', () => {
      const count = countWords('');
      expect(count).toBe(0);
    });

    it('should handle text with extra spaces', () => {
      const text = '  This   is  a   test  with   seven   words.  ';
      const count = countWords(text);
      
      expect(count).toBe(7);
    });

    it('should handle markdown formatting', () => {
      const text = '# Header\n\nThis is **bold** and *italic* text with [links](http://example.com).';
      const count = countWords(text);
      
      // Should count actual content words, ignoring markdown
      expect(count).toBe(9); // "Header", "This", "is", "bold", "and", "italic", "text", "with", "links"
    });

    it('should handle code blocks', () => {
      const text = 'Here is some code:\n\n```\nfunction test() {\n  return "hello";\n}\n```\n\nAnd more text.';
      const count = countWords(text);
      
      // Should exclude code block content
      expect(count).toBe(6); // "Here", "is", "some", "code", "And", "more", "text"
    });

    it('should handle URLs', () => {
      const text = 'Visit https://example.com for more information.';
      const count = countWords(text);
      
      // Should exclude URLs
      expect(count).toBe(4); // "Visit", "for", "more", "information"
    });

    it('should handle special characters and punctuation', () => {
      const text = 'Hello, world! How are you? I\'m fine.';
      const count = countWords(text);
      
      expect(count).toBe(8); // "Hello", "world", "How", "are", "you", "I'm", "fine"
    });

    it('should handle numbers', () => {
      const text = 'There are 123 apples and 456 oranges.';
      const count = countWords(text);
      
      expect(count).toBe(6); // "There", "are", "123", "apples", "and", "456", "oranges"
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界! How are you?';
      const count = countWords(text);
      
      expect(count).toBe(6); // "Hello", "世界", "How", "are", "you"
    });
  });

  describe('safeMatch', () => {
    it('should match patterns successfully', async () => {
      const text = 'This is a test string.';
      const pattern = /test/;
      
      const result = await safeMatch(text, pattern);
      
      expect(result).toEqual(expect.arrayContaining(['test']));
    });

    it('should timeout on long-running regex', async () => {
      const text = 'a'.repeat(10000) + 'b';
      // This regex can cause catastrophic backtracking
      const pattern = /(a+)+b/;
      
      await expect(safeMatch(text, pattern, 50))
        .rejects
        .toThrow('Regex timeout - potential ReDoS attack');
    });

    it('should handle regex errors', async () => {
      const text = 'test';
      const pattern = /[/; // Invalid regex
      
      await expect(safeMatch(text, pattern))
        .rejects
        .toThrow();
    });

    it('should handle null text', async () => {
      const pattern = /test/;
      
      const result = await safeMatch(null, pattern);
      
      expect(result).toBeNull();
    });

    it('should handle undefined text', async () => {
      const pattern = /test/;
      
      const result = await safeMatch(undefined, pattern);
      
      expect(result).toBeNull();
    });

    it('should handle null pattern', async () => {
      const text = 'test';
      
      await expect(safeMatch(text, null))
        .rejects
        .toThrow();
    });

    it('should handle undefined pattern', async () => {
      const text = 'test';
      
      await expect(safeMatch(text, undefined))
        .rejects
        .toThrow();
    });

    it('should use default timeout when not specified', async () => {
      const text = 'This is a test string.';
      const pattern = /test/;
      
      const result = await safeMatch(text, pattern);
      
      expect(result).toEqual(expect.arrayContaining(['test']));
    });

    it('should handle empty text', async () => {
      const text = '';
      const pattern = /test/;
      
      const result = await safeMatch(text, pattern);
      
      expect(result).toBeNull();
    });

    it('should handle empty pattern', async () => {
      const text = 'test';
      const pattern = new RegExp('');
      
      const result = await safeMatch(text, pattern);
      
      expect(result).toEqual(['']);
    });

    it('should handle multiline text', async () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const pattern = /Line \d+/g;
      
      const result = await safeMatch(text, pattern);
      
      expect(result).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });
  });
});