#!/usr/bin/env node

/**
 * Source Lines of Code (SLOC) Metrics Script
 *
 * This script measures the source lines of code in the monorepo and generates metrics
 * for both the entire project and the multiagent-consensus package.
 *
 * Usage:
 *   node scripts/measure-sloc.js
 */

// For this utility script, we disable some lint rules that would otherwise apply
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const sloc = require('sloc');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const packageDir = path.resolve(rootDir, 'packages/multiagent-consensus');
const ignoreDirs = ['node_modules', 'dist', 'coverage', '.next', '.turbo', '.git'];

/**
 * Fixed mapping for sloc - the sloc library has specific language identifiers
 * that don't match file extensions directly.
 *
 * IMPORTANT: These must match the expected languages in the sloc package!
 */
const extensionToLanguage = {
  '.ts': 'js', // TypeScript is treated as JavaScript
  '.tsx': 'js', // React TypeScript is treated as JavaScript
  '.js': 'js',
  '.jsx': 'js',
  '.json': 'json',
  '.md': 'md', // Markdown
  '.css': 'css',
  '.scss': 'css', // SCSS is treated as CSS
  '.html': 'html',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

// Categories for organizing files
const categories = {
  core: /\/src\/(?!(__tests__|tests))/i,
  tests: /\/(src\/__tests__|tests)\//i,
  examples: /\/examples\//i,
  configs: /\.(json|config\.js|eslintrc|prettierrc|babelrc)/i,
  docs: /\.(md|mdx|txt)$/i,
};

// Results storage
const results = {
  monorepo: { total: 0, byLanguage: {}, byCategory: {} },
  package: { total: 0, byLanguage: {}, byCategory: {} },
};

// Initialize categories
Object.keys(categories).forEach(category => {
  results.monorepo.byCategory[category] = 0;
  results.package.byCategory[category] = 0;
});

/**
 * Get all files recursively in a directory
 */
function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);

      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          if (!ignoreDirs.includes(file)) {
            fileList = getAllFiles(filePath, fileList);
          }
        } else {
          fileList.push(filePath);
        }
      } catch (err) {
        console.error(`Error accessing ${filePath}: ${err.message}`);
      }
    });

    return fileList;
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return fileList;
  }
}

/**
 * Categorize a file based on its path
 */
function categorizeFile(filePath) {
  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(filePath)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Process a file and add its metrics to results
 */
function processFile(filePath, isPackageFile) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const language = extensionToLanguage[ext];

    if (!language) {
      // Skip files with unsupported extensions, but don't complain
      return;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Get the stats
    const stats = sloc(content, language);
    const category = categorizeFile(filePath);

    // For prettier display in the final report, use the file extension
    // instead of the sloc internal language name
    const displayLanguage = ext.substring(1); // Remove the dot

    // Add to monorepo stats
    results.monorepo.total += stats.source;
    results.monorepo.byLanguage[displayLanguage] =
      (results.monorepo.byLanguage[displayLanguage] || 0) + stats.source;
    results.monorepo.byCategory[category] =
      (results.monorepo.byCategory[category] || 0) + stats.source;

    // Also add to package stats if this file is part of the package
    if (isPackageFile) {
      results.package.total += stats.source;
      results.package.byLanguage[displayLanguage] =
        (results.package.byLanguage[displayLanguage] || 0) + stats.source;
      results.package.byCategory[category] =
        (results.package.byCategory[category] || 0) + stats.source;
    }
  } catch (error) {
    // Uncomment for debugging specific file issues
    // console.error(`Error processing file ${filePath}:`, error.message);
  }
}

/**
 * Format metrics into a readable string for markdown
 */
function formatMetrics(metrics) {
  let output = '';

  // Overall total
  output += `- **Total**: ${metrics.total} lines\n\n`;

  // By language
  output += '### By Language\n\n';
  output += '| Language | Lines |\n';
  output += '|----------|-------|\n';

  const sortedLanguages = Object.entries(metrics.byLanguage).sort((a, b) => b[1] - a[1]); // Sort by line count (descending)

  for (const [language, lines] of sortedLanguages) {
    output += `| ${language} | ${lines.toLocaleString()} |\n`;
  }

  output += '\n';

  // By category
  output += '### By Category\n\n';
  output += '| Category | Lines |\n';
  output += '|----------|-------|\n';

  const sortedCategories = Object.entries(metrics.byCategory).sort((a, b) => b[1] - a[1]); // Sort by line count (descending)

  for (const [category, lines] of sortedCategories) {
    if (lines > 0) {
      output += `| ${category} | ${lines.toLocaleString()} |\n`;
    }
  }

  return output;
}

/**
 * Update README.md files with metrics
 */
function updateReadmeFiles() {
  // Format metrics for both the monorepo and the package
  const monorepoMetrics = formatMetrics(results.monorepo);
  const packageMetrics = formatMetrics(results.package);

  // Update monorepo README
  try {
    const monorepoReadmePath = path.join(rootDir, 'README.md');
    let readmeContent = fs.readFileSync(monorepoReadmePath, 'utf8');

    // Check if metrics section already exists
    const metricsSection = '## 📊 Code Metrics';
    if (readmeContent.includes(metricsSection)) {
      // Create a more precise regex that matches the entire section from the metrics header
      // until the next header (starts with ##) or the end of the file
      const regex = new RegExp(`${metricsSection}[\\s\\S]*?(?=\n## |$)`, 'g');
      readmeContent = readmeContent.replace(regex, `${metricsSection}\n\n${monorepoMetrics}`);
    } else {
      // Append metrics section before the license section or at the end
      if (readmeContent.includes('## 📄 License')) {
        readmeContent = readmeContent.replace(
          '## 📄 License',
          `${metricsSection}\n\n${monorepoMetrics}\n\n## 📄 License`
        );
      } else {
        readmeContent += `\n\n${metricsSection}\n\n${monorepoMetrics}`;
      }
    }

    fs.writeFileSync(monorepoReadmePath, readmeContent);
    console.log('✅ Updated monorepo README.md with metrics');
  } catch (error) {
    console.error('Error updating monorepo README:', error.message);
  }

  // Update package README
  try {
    const packageReadmePath = path.join(packageDir, 'README.md');
    let readmeContent = fs.readFileSync(packageReadmePath, 'utf8');

    // Check if metrics section already exists
    const metricsSection = '## 📊 Code Metrics';
    if (readmeContent.includes(metricsSection)) {
      // Create a more precise regex that matches the entire section from the metrics header
      // until the next header (starts with ##) or the end of the file
      const regex = new RegExp(`${metricsSection}[\\s\\S]*?(?=\n## |$)`, 'g');
      readmeContent = readmeContent.replace(regex, `${metricsSection}\n\n${packageMetrics}`);
    } else {
      // Append metrics section before the license section or at the end
      if (readmeContent.includes('## License')) {
        readmeContent = readmeContent.replace(
          '## License',
          `${metricsSection}\n\n${packageMetrics}\n\n## License`
        );
      } else {
        readmeContent += `\n\n${metricsSection}\n\n${packageMetrics}`;
      }
    }

    fs.writeFileSync(packageReadmePath, readmeContent);
    console.log('✅ Updated package README.md with metrics');
  } catch (error) {
    console.error('Error updating package README:', error.message);
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🔍 Analyzing source lines of code...');

  // Process all files in the monorepo
  const allFiles = getAllFiles(rootDir);
  console.log(`Found ${allFiles.length} files to analyze`);

  // Determine which files are part of the package
  const packagePrefix = packageDir + path.sep;

  for (const file of allFiles) {
    const isPackageFile = file.startsWith(packagePrefix);
    processFile(file, isPackageFile);
  }

  // Log results
  console.log('\n📊 Monorepo SLOC Metrics:');
  console.log(`Total: ${results.monorepo.total.toLocaleString()} lines`);
  console.log('By Language:', results.monorepo.byLanguage);
  console.log('By Category:', results.monorepo.byCategory);

  console.log('\n📊 Package SLOC Metrics:');
  console.log(`Total: ${results.package.total.toLocaleString()} lines`);
  console.log('By Language:', results.package.byLanguage);
  console.log('By Category:', results.package.byCategory);

  // Update README files
  updateReadmeFiles();

  console.log('\n✨ Done! SLOC metrics have been measured and added to README files.');
}

// Execute main function
main();
