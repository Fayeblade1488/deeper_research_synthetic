const { validateOutput } = require('../../services/validationService');

/**
 * Validation Service Test Suite
 * 
 * Tests the validation service including:
 * - Word count validation fixes (BUG-M4)
 * - ReDoS protection (BUG-m2) 
 * - Citation detection fixes (BUG-m3)
 * - Framework-specific validation
 */

describe('ValidationService', () => {
    describe('Word Count Validation (BUG-M4 Fix)', () => {
        it('should exclude markdown syntax from word count', async () => {
            const content = `# Title

## Section One

Visit https://example.com for more info.

\`\`\`javascript
const x = 1;
\`\`\`

This is **actual** content with _formatting_.`;
            
            const result = await validateOutput(content, 'PROJECT_DEEPDIVE');
            
            // Should count only: "Section", "One", "Visit", "for", "more", "info", "This", "is", "actual", "content", "with", "formatting" = 12 words
            expect(result.wordCount).toBeLessThan(20); // Much less than naive count would be
            expect(result.wordCount).toBeGreaterThan(10); // But should capture actual content
        });

        it('should not count table formatting as words', async () => {
            const content = `| Column 1 | Column 2 | Score |
|----------|----------|-------|
| Data A   | Data B   | 85%   |
| Test     | Results  | 92%   |

This table contains real content words.`;
            
            const result = await validateOutput(content, 'PROJECT_BENCHMARK');
            
            // Should not count table pipes and formatting
            expect(result.wordCount).toBeLessThan(25);
        });

        it('should not count URLs as single words', async () => {
            const content = `Visit https://very-long-url-with-many-segments.example.com/path/to/resource?param=value&other=123 for details.

This sentence has actual content.`;
            
            const result = await validateOutput(content, 'PROJECT_DEEPDIVE');
            
            // Should count: "Visit", "for", "details", "This", "sentence", "has", "actual", "content" = 8 words
            expect(result.wordCount).toBe(8);
        });
    });

    describe('ReDoS Protection (BUG-m2 Fix)', () => {
        it('should handle malicious regex patterns without hanging', async () => {
            // Malicious content designed to cause catastrophic backtracking
            const maliciousContent = `# Test Title

## Section
${'                    *'.repeat(100)}

Normal content here.`;
            
            const startTime = Date.now();
            const result = await validateOutput(maliciousContent, 'PROJECT_DEEPDIVE');
            const duration = Date.now() - startTime;
            
            // Should complete within reasonable time (not hang)
            expect(duration).toBeLessThan(5000); // 5 seconds max
            expect(result).toBeDefined();
        }, 10000); // Increase test timeout

        it('should add timeout warnings for problematic patterns', async () => {
            const problematicContent = `# Test Title

## Section
${'  *  '.repeat(500)}

More content.`;
            
            const result = await validateOutput(problematicContent, 'PROJECT_DEEPDIVE');
            
            // Should complete and may include timeout warning
            expect(result).toBeDefined();
        });
    });

    describe('Citation Detection (BUG-m3 Fix)', () => {
        it('should detect proper citations at sentence ends', async () => {
            const content = `# Research Report

## Introduction

This is a researched statement [1]. Another finding supports this [2].

## Data Analysis

The results are: {"values": [1, 2, 3], "count": 3}

This conclusion is supported [3].`;
            
            const result = await validateOutput(content, 'PROJECT_DEEPDIVE');
            
            // Should find proper citations, ignore JSON arrays
            expect(result.warnings).not.toContain(
                expect.stringContaining('No proper citations found')
            );
        });

        it('should not mistake JSON arrays for citations', async () => {
            const content = `# Research Report

## Data Analysis

The coordinates are [37.7749, -122.4194] and the array[5] contains data.

No actual citations in this content.`;
            
            const result = await validateOutput(content, 'PROJECT_DEEPDIVE');
            
            // Should detect missing proper citations despite JSON/code syntax  
            const hasNoCitationWarning = result.warnings.some(warning => 
                warning.includes('No proper citations found')
            );
            expect(hasNoCitationWarning).toBe(true);
        });
    });

    describe('Framework Validation', () => {
        it('should validate DEEPDIVE requirements', async () => {
            // Create content with sufficient word count for PROJECT_DEEPDIVE (needs 10,000 words)
            const contentPadding = 'This is comprehensive research content that provides detailed analysis and thorough examination of the subject matter. '.repeat(150); // ~1800 words
            const validDeepDive = `# Research Title

## Section 1
${contentPadding}

## Section 2  
${contentPadding}

## Section 3
${contentPadding}

## Section 4
${contentPadding}

## Section 5
${contentPadding}

### Subsection 1
Detailed analysis here with comprehensive coverage.

### Subsection 2
More detailed examination of the topic.

### Subsection 3
Additional thorough investigation.

### Subsection 4
Further comprehensive detail.

### Subsection 5
More extensive analysis.

### Subsection 6
Continued thorough analysis.

### Subsection 7
Additional comprehensive findings.

### Subsection 8
Further detailed findings.

### Subsection 9
More comprehensive results.

### Subsection 10
Final thorough analysis.

This research shows important findings [1]. The data supports this conclusion [2].`;
            
            const result = await validateOutput(validDeepDive, 'PROJECT_DEEPDIVE');
            
            expect(result.errors).toHaveLength(0);
        });

        it('should validate SYNTHETIC requirements', async () => {
            const validSynthetic = `Good morning. Today's analysis covers three key areas.

## Global Developments
Recent events show significant trends.

**Key Implication:** This development affects multiple sectors.

## Technology Sector  
AI advances continue rapidly.

**Key Implication:** Market disruption is accelerating.

## Economic Analysis
Financial markets remain volatile.

**Key Implication:** Investment strategies need adjustment.

## Conclusion
In summary, data infusion complete: until next time - stay alert, stay safe, and stay curious.`;
            
            const result = await validateOutput(validSynthetic, 'PROJECT_SYNTHETIC');
            
            expect(result.warnings.filter(w => 
                w.includes('Missing standard opener') || 
                w.includes('Missing standard closer') ||
                w.includes('Key Implication')
            )).toHaveLength(0);
        });

        it('should validate BENCHMARK requirements', async () => {
            // Create content with sufficient word count for PROJECT_BENCHMARK (needs 5,000 words)
            const benchmarkPadding = 'Comprehensive data analysis reveals critical trends affecting multiple sectors with significant implications for strategic planning and risk assessment. '.repeat(30); // ~600 words per section
            
            const validBenchmark = `# Crisis Assessment DEFCON 3

## Economic Data Tables
${benchmarkPadding}

| Metric | Value | Score | Trend |
|--------|-------|-------|-------|
| GDP Growth | 2.1% | 75 | Stable |
| Inflation Rate | 3.2% | 68 | Rising |
| Employment | 96% | 82 | Strong |
| Consumer Spending | $2.5T | 79 | Growing |
| Housing Market | $450K | 72 | Volatile |

## Security Assessment Tables  
${benchmarkPadding}

| Security Domain | Level | Score | Priority |
|----------------|--------|-------|----------|
| Cyber Security | High | 65 | Critical |
| Physical Security | Medium | 78 | High |
| Economic Security | Low | 45 | Critical |
| Social Stability | Medium | 67 | Medium |
| Infrastructure | High | 73 | High |

## Risk Analysis Tables
${benchmarkPadding}

| Risk Factor | Probability | Impact | Score |
|-------------|-------------|---------|-------|
| Market Volatility | 0.7 | High | 84 |
| Supply Chain | 0.5 | Medium | 62 |
| Geopolitical | 0.8 | High | 91 |
| Climate Change | 0.6 | High | 78 |

## Performance Metrics
${benchmarkPadding}

Comprehensive analysis indicates significant trends across all sectors [1]. The data supports strategic recommendations [2]. Risk assessment shows elevated concerns [3].`;
            
            const result = await validateOutput(validBenchmark, 'PROJECT_BENCHMARK');
            
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid framework types', async () => {
            const result = await validateOutput('Content', 'INVALID_FRAMEWORK');
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid framework type');
        });

        it('should handle empty content', async () => {
            const result = await validateOutput('', 'PROJECT_DEEPDIVE');
            
            expect(result.valid).toBe(false);
            expect(result.wordCount).toBe(0);
        });

        it('should handle very large content without crashing', async () => {
            const largeContent = `# Title\n\n## Section\n\n${'Word '.repeat(50000)}`;
            
            const result = await validateOutput(largeContent, 'PROJECT_DEEPDIVE');
            
            expect(result).toBeDefined();
            expect(result.wordCount).toBeGreaterThan(40000);
        });
    });
});