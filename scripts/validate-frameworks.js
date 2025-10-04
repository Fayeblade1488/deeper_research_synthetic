#!/usr/bin/env node

/**
 * Framework Validation Script
 * 
 * Validates YAML persona framework files against the schema definition.
 * Provides detailed error reporting and validation statistics.
 * 
 * Usage:
 *   node scripts/validate-frameworks.js [directory]
 *   npm run lint:frameworks
 * 
 * @author Paradroid AI
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Configuration
const DEFAULT_FRAMEWORKS_DIR = path.join(__dirname, '../data/frameworks/scratchpads');
const SCHEMA_PATH = path.join(__dirname, '../data/frameworks/schema/persona-framework-schema.yaml');

/**
 * Load and parse YAML schema file
 * 
 * @returns {Promise<Object>} Parsed schema object
 * @throws {Error} When schema file cannot be loaded or parsed
 */
async function loadSchema() {
    try {
        const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
        const schema = yaml.parse(schemaContent);
        return schema;
    } catch (error) {
        throw new Error(`Failed to load schema: ${error.message}`);
    }
}

/**
 * Get all YAML files in a directory
 * 
 * @param {string} directory - Directory path to scan
 * @returns {Promise<Array<string>>} Array of YAML file paths
 */
async function getYamlFiles(directory) {
    try {
        const files = await fs.readdir(directory);
        return files
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
            .map(file => path.join(directory, file));
    } catch (error) {
        throw new Error(`Failed to read directory ${directory}: ${error.message}`);
    }
}

/**
 * Load and parse a YAML framework file
 * 
 * @param {string} filePath - Path to YAML file
 * @returns {Promise<Object>} Parsed YAML content with metadata
 */
async function loadFrameworkFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = yaml.parse(content);
        
        return {
            filePath,
            fileName: path.basename(filePath),
            content: parsed,
            rawContent: content
        };
    } catch (error) {
        return {
            filePath,
            fileName: path.basename(filePath),
            error: `Parse error: ${error.message}`,
            content: null
        };
    }
}

/**
 * Validate a framework against the schema
 * 
 * @param {Object} ajv - AJV validator instance
 * @param {Object} framework - Framework data to validate
 * @returns {Object} Validation result with errors and warnings
 */
function validateFramework(ajv, framework) {
    const result = {
        valid: false,
        errors: [],
        warnings: [],
        stats: {}
    };
    
    // Skip if parse error
    if (framework.error) {
        result.errors.push(framework.error);
        return result;
    }
    
    if (!framework.content) {
        result.errors.push('No content found');
        return result;
    }
    
    // Schema validation
    const validate = ajv.compile(loadedSchema);
    const valid = validate(framework.content);
    
    if (!valid) {
        result.errors = validate.errors.map(error => {
            const path = error.instancePath || 'root';
            const message = error.message;
            const value = error.data;
            return `${path}: ${message} ${value ? `(got: ${JSON.stringify(value)})` : ''}`;
        });
    } else {
        result.valid = true;
    }
    
    // Additional validation checks
    if (framework.content) {
        // Calculate stats
        const content = framework.content;
        result.stats = {
            hasName: !!content.name,
            hasVersion: !!content.version,
            hasDocumentation: !!content.documentation,
            hasFramework: !!content.framework,
            frameworkContentLength: content.framework?.content?.length || 0,
            documentedCharCount: content.documentation?.character_count || 0,
            actualCharCount: content.framework?.content?.length || 0
        };
        
        // Character count validation
        if (result.stats.documentedCharCount && result.stats.actualCharCount) {
            const difference = Math.abs(result.stats.documentedCharCount - result.stats.actualCharCount);
            const percentDiff = (difference / result.stats.actualCharCount) * 100;
            
            if (percentDiff > 20) {
                result.warnings.push(`Character count mismatch: documented ${result.stats.documentedCharCount}, actual ${result.stats.actualCharCount} (${percentDiff.toFixed(1)}% difference)`);
            }
        }
        
        // Content quality checks
        if (content.framework?.content) {
            const frameworkContent = content.framework.content.toLowerCase();
            
            // Check for placeholder text
            if (frameworkContent.includes('todo') || frameworkContent.includes('placeholder')) {
                result.warnings.push('Framework content contains TODO or placeholder text');
            }
            
            // Check for minimum content quality
            if (frameworkContent.length < 500) {
                result.warnings.push('Framework content is very short (< 500 characters)');
            }
            
            // Check for required patterns in specific framework types
            if (content.name?.toLowerCase().includes('research')) {
                if (!frameworkContent.includes('cite') && !frameworkContent.includes('citation')) {
                    result.warnings.push('Research framework should include citation requirements');
                }
            }
            
            if (content.name?.toLowerCase().includes('podcast') || content.name?.toLowerCase().includes('synthetic')) {
                if (!frameworkContent.includes('good morning')) {
                    result.warnings.push('Podcast framework should include "Good morning" opener');
                }
            }
        }
        
        // Version format check
        if (content.version && !/^\d+\.\d+(\.\d+)?/.test(content.version)) {
            result.warnings.push(`Version format should be semantic (e.g., "1.0.0"), got "${content.version}"`);
        }
    }
    
    return result;
}

/**
 * Format validation results for console output
 * 
 * @param {Object} framework - Framework data
 * @param {Object} validation - Validation result
 * @returns {string} Formatted output
 */
function formatValidationResult(framework, validation) {
    const fileName = framework.fileName;
    let output = [];
    
    if (validation.valid && validation.errors.length === 0) {
        output.push(`✅ ${fileName}: VALID`);
        
        if (validation.warnings.length > 0) {
            output.push(`   Warnings:`);
            validation.warnings.forEach(warning => {
                output.push(`   ⚠️  ${warning}`);
            });
        }
        
        if (validation.stats) {
            output.push(`   Stats: ${validation.stats.actualCharCount} chars, version ${framework.content?.version || 'N/A'}`);
        }
    } else {
        output.push(`❌ ${fileName}: INVALID`);
        
        if (validation.errors.length > 0) {
            output.push(`   Errors:`);
            validation.errors.forEach(error => {
                output.push(`   🚫 ${error}`);
            });
        }
        
        if (validation.warnings.length > 0) {
            output.push(`   Warnings:`);
            validation.warnings.forEach(warning => {
                output.push(`   ⚠️  ${warning}`);
            });
        }
    }
    
    return output.join('\\n');
}

/**
 * Main validation function
 * 
 * @param {string} directory - Directory containing YAML frameworks
 * @returns {Promise<void>}
 */
async function main(directory = DEFAULT_FRAMEWORKS_DIR) {
    console.log('🔍 Deeper Research Synthetic Framework Validator\\n');
    console.log(`Validating frameworks in: ${directory}`);
    console.log(`Schema: ${SCHEMA_PATH}\\n`);
    
    try {
        // Load schema
        global.loadedSchema = await loadSchema();
        console.log(`✅ Schema loaded successfully\\n`);
        
        // Initialize AJV
        const ajv = new Ajv({ allErrors: true, verbose: true });
        addFormats(ajv);
        
        // Get YAML files
        const yamlFiles = await getYamlFiles(directory);
        
        if (yamlFiles.length === 0) {
            console.log(`⚠️  No YAML files found in ${directory}`);
            return;
        }
        
        console.log(`Found ${yamlFiles.length} YAML files\\n`);
        
        // Process each file
        const results = [];
        for (const filePath of yamlFiles) {
            const framework = await loadFrameworkFile(filePath);
            const validation = validateFramework(ajv, framework);
            results.push({ framework, validation });
            
            console.log(formatValidationResult(framework, validation));
            console.log(''); // Empty line between results
        }
        
        // Summary
        const validCount = results.filter(r => r.validation.valid && r.validation.errors.length === 0).length;
        const invalidCount = results.length - validCount;
        const warningCount = results.reduce((sum, r) => sum + r.validation.warnings.length, 0);
        
        console.log('\\n📊 VALIDATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total files: ${results.length}`);
        console.log(`✅ Valid: ${validCount}`);
        console.log(`❌ Invalid: ${invalidCount}`);
        console.log(`⚠️  Total warnings: ${warningCount}`);
        
        if (invalidCount > 0) {
            console.log('\\n❌ Some frameworks failed validation. Please fix the errors above.');
            process.exit(1);
        } else if (warningCount > 0) {
            console.log('\\n⚠️  All frameworks are valid but have warnings. Consider addressing them for better quality.');
            process.exit(0);
        } else {
            console.log('\\n🎉 All frameworks are valid with no warnings!');
            process.exit(0);
        }
        
    } catch (error) {
        console.error(`\\n💥 Validation failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const directory = process.argv[2] || DEFAULT_FRAMEWORKS_DIR;
    main(directory).catch(error => {
        console.error(`💥 Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    loadSchema,
    getYamlFiles,
    loadFrameworkFile,
    validateFramework,
    main
};