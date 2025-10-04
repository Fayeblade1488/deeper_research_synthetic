#!/usr/bin/env node

/**
 * Fix Version Formats Script
 * 
 * Updates all YAML framework version fields to use semantic versioning (e.g., 1.0.0).
 * Handles various version formats: "1.0" -> "1.0.0", "5.0" -> "5.0.0", "1.3" -> "1.3.0"
 * 
 * @author Paradroid AI
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

const FRAMEWORKS_DIR = path.join(__dirname, '../data/frameworks/scratchpads');

/**
 * Convert version string to semantic versioning format
 * @param {string} version - Current version string
 * @returns {string} Semantic version string
 */
function toSemanticVersion(version) {
    // Remove quotes if present
    version = version.replace(/['"]/g, '');
    
    const parts = version.split('.');
    
    // Add missing parts
    while (parts.length < 3) {
        parts.push('0');
    }
    
    return parts.join('.');
}

/**
 * Update version in YAML file
 * @param {string} filePath - Path to YAML file
 * @returns {Promise<Object>} Result of update operation
 */
async function updateVersionInFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let updated = false;
        let oldVersion = null;
        let newVersion = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Match version line (e.g., "version: '1.0'")
            const versionMatch = line.match(/^version:\s*['"]?([^'"]+)['"]?$/);
            
            if (versionMatch) {
                oldVersion = versionMatch[1];
                newVersion = toSemanticVersion(oldVersion);
                
                // Only update if version changed
                if (oldVersion !== newVersion) {
                    lines[i] = `version: '${newVersion}'`;
                    updated = true;
                }
                break;
            }
        }
        
        if (updated) {
            await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
            return {
                success: true,
                filePath,
                fileName: path.basename(filePath),
                oldVersion,
                newVersion
            };
        }
        
        return {
            success: false,
            filePath,
            fileName: path.basename(filePath),
            message: 'No version update needed or version not found'
        };
        
    } catch (error) {
        return {
            success: false,
            filePath,
            fileName: path.basename(filePath),
            error: error.message
        };
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🔧 Fixing YAML Framework Version Formats\n');
    console.log(`Directory: ${FRAMEWORKS_DIR}\n`);
    
    try {
        // Get all YAML files
        const files = await fs.readdir(FRAMEWORKS_DIR);
        const yamlFiles = files
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
            .map(file => path.join(FRAMEWORKS_DIR, file));
        
        if (yamlFiles.length === 0) {
            console.log('⚠️  No YAML files found');
            return;
        }
        
        console.log(`Found ${yamlFiles.length} YAML files\n`);
        
        // Process each file
        const results = [];
        for (const filePath of yamlFiles) {
            const result = await updateVersionInFile(filePath);
            results.push(result);
            
            if (result.success) {
                console.log(`✅ ${result.fileName}: ${result.oldVersion} → ${result.newVersion}`);
            } else if (result.error) {
                console.log(`❌ ${result.fileName}: ERROR - ${result.error}`);
            } else {
                console.log(`⏭️  ${result.fileName}: ${result.message}`);
            }
        }
        
        // Summary
        const updated = results.filter(r => r.success).length;
        const errors = results.filter(r => r.error).length;
        
        console.log('\n📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total files: ${results.length}`);
        console.log(`✅ Updated: ${updated}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`⏭️  Skipped: ${results.length - updated - errors}`);
        
        if (updated > 0) {
            console.log('\n🎉 Version formats fixed successfully!');
            console.log('Run validation again to confirm: npm run lint:frameworks');
        }
        
    } catch (error) {
        console.error(`\n💥 Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(`💥 Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { toSemanticVersion, updateVersionInFile, main };
