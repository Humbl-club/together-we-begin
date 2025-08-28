/**
 * TYPESCRIPT TYPE VERIFICATION AND ERROR DEBUGGING TEST SUITE
 * 
 * This test suite analyzes the 158+ TypeScript errors and creates comprehensive
 * type verification tests to identify and fix type mismatches after database repair.
 * 
 * Usage: node test-typescript-types.js
 */

import { execSync, spawn } from 'child_process';
import { readFile, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import chalk from 'chalk';

// Test results storage
let testResults = {
  typescript: {
    totalErrors: 0,
    errorsByCategory: {},
    errorsByFile: {},
    criticalErrors: [],
    fixableErrors: [],
    compilationPasses: false
  },
  types: {
    databaseTypesExist: false,
    organizationTypesExist: false,
    supabaseTypesGenerated: false,
    typeDefinitions: {},
    missingTypes: []
  },
  imports: {
    circularDependencies: [],
    missingModules: [],
    unresolvedImports: [],
    workingImports: []
  },
  components: {
    renderingErrors: [],
    propTypeErrors: [],
    contextErrors: [],
    hookErrors: []
  }
};

/**
 * Parse TypeScript compilation errors
 */
function parseTypeScriptErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;
  
  for (const line of lines) {
    // Match error pattern: file(line,col): error TS####: message
    const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
    
    if (errorMatch) {
      if (currentError) {
        errors.push(currentError);
      }
      
      currentError = {
        file: errorMatch[1],
        line: parseInt(errorMatch[2]),
        column: parseInt(errorMatch[3]),
        severity: errorMatch[4],
        code: `TS${errorMatch[5]}`,
        message: errorMatch[6],
        details: []
      };
    } else if (currentError && line.trim() && !line.includes('Found ') && !line.includes('error')) {
      // Add additional details to current error
      currentError.details.push(line.trim());
    }
  }
  
  if (currentError) {
    errors.push(currentError);
  }
  
  return errors;
}

/**
 * Categorize TypeScript errors
 */
function categorizeErrors(errors) {
  const categories = {
    'Database Types': [],
    'Organization Types': [],
    'Component Props': [],
    'Hook Types': [],
    'Import/Export': [],
    'React Types': [],
    'Supabase Types': [],
    'Generic Types': [],
    'Other': []
  };
  
  for (const error of errors) {
    let categorized = false;
    
    // Database type errors
    if (error.message.includes('Database') || 
        error.message.includes('organization_') ||
        error.message.includes('profiles') ||
        error.file.includes('database.types.ts')) {
      categories['Database Types'].push(error);
      categorized = true;
    }
    
    // Organization-specific type errors
    if (error.message.includes('Organization') ||
        error.file.includes('organization') ||
        error.file.includes('OrganizationContext')) {
      categories['Organization Types'].push(error);
      categorized = true;
    }
    
    // Component prop errors
    if (error.message.includes('Property') && 
        (error.message.includes('does not exist') || error.message.includes('is missing'))) {
      categories['Component Props'].push(error);
      categorized = true;
    }
    
    // Hook type errors
    if (error.file.includes('/hooks/') || error.message.includes('useOrganization')) {
      categories['Hook Types'].push(error);
      categorized = true;
    }
    
    // Import/Export errors
    if (error.message.includes('Cannot find module') ||
        error.message.includes('has no exported member') ||
        error.code === 'TS2307' || error.code === 'TS2305') {
      categories['Import/Export'].push(error);
      categorized = true;
    }
    
    // React type errors
    if (error.message.includes('JSX') || 
        error.message.includes('React') ||
        error.message.includes('FC<') ||
        error.message.includes('PropsWithChildren')) {
      categories['React Types'].push(error);
      categorized = true;
    }
    
    // Supabase type errors
    if (error.message.includes('supabase') ||
        error.message.includes('createClient') ||
        error.file.includes('supabase')) {
      categories['Supabase Types'].push(error);
      categorized = true;
    }
    
    // Generic TypeScript errors
    if ((error.code === 'TS2322' || error.code === 'TS2571' || error.code === 'TS2339') && !categorized) {
      categories['Generic Types'].push(error);
      categorized = true;
    }
    
    if (!categorized) {
      categories['Other'].push(error);
    }
  }
  
  return categories;
}

/**
 * Check TypeScript compilation
 */
async function checkTypeScriptCompilation() {
  console.log(chalk.blue('\n📋 RUNNING TYPESCRIPT COMPILATION CHECK...'));
  
  try {
    // Run TypeScript compiler
    console.log('Running tsc --noEmit...');
    
    let tscOutput = '';
    let tscError = null;
    
    try {
      tscOutput = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000 // 60 second timeout
      });
      
      console.log(chalk.green('✅ TypeScript compilation passed!'));
      testResults.typescript.compilationPasses = true;
      
    } catch (error) {
      tscError = error;
      tscOutput = error.stdout || error.message;
      
      console.log(chalk.red('❌ TypeScript compilation failed'));
      console.log(chalk.gray('Parsing errors...'));
    }
    
    // Parse and categorize errors
    if (tscOutput && tscOutput.includes('error TS')) {
      const errors = parseTypeScriptErrors(tscOutput);
      const categorized = categorizeErrors(errors);
      
      testResults.typescript.totalErrors = errors.length;
      testResults.typescript.errorsByCategory = categorized;
      
      // Group errors by file
      const errorsByFile = {};
      errors.forEach(error => {
        const fileName = error.file.split('/').pop() || error.file;
        if (!errorsByFile[fileName]) {
          errorsByFile[fileName] = [];
        }
        errorsByFile[fileName].push(error);
      });
      
      testResults.typescript.errorsByFile = errorsByFile;
      
      // Identify critical vs fixable errors
      errors.forEach(error => {
        if (error.code === 'TS2307' || // Cannot find module
            error.code === 'TS2305' || // Module has no exported member
            error.message.includes('organizations') ||
            error.message.includes('Database')) {
          testResults.typescript.criticalErrors.push(error);
        } else {
          testResults.typescript.fixableErrors.push(error);
        }
      });
      
      console.log(chalk.red(`Found ${errors.length} TypeScript errors`));
      console.log(chalk.yellow(`Critical errors: ${testResults.typescript.criticalErrors.length}`));
      console.log(chalk.blue(`Fixable errors: ${testResults.typescript.fixableErrors.length}`));
      
      // Show top error categories
      Object.entries(categorized).forEach(([category, categoryErrors]) => {
        if (categoryErrors.length > 0) {
          console.log(chalk.gray(`${category}: ${categoryErrors.length} errors`));
        }
      });
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ TypeScript check failed: ${error.message}`));
  }
}

/**
 * Verify critical type definitions exist
 */
async function verifyTypeDefinitions() {
  console.log(chalk.blue('\n🔍 VERIFYING TYPE DEFINITIONS...'));
  
  const criticalTypeFiles = [
    {
      path: 'client/src/types/organization.ts',
      name: 'Organization Types',
      requiredTypes: [
        'Organization',
        'OrganizationMember', 
        'OrganizationContextType',
        'OrganizationFeature',
        'OrganizationTheme',
        'OrganizationTypography',
        'OrganizationBranding'
      ]
    },
    {
      path: 'client/src/integrations/supabase/types.ts',
      name: 'Database Types',
      requiredTypes: [
        'Database',
        'Tables',
        'organizations',
        'organization_members',
        'profiles'
      ]
    }
  ];
  
  for (const typeFile of criticalTypeFiles) {
    try {
      await access(typeFile.path);
      const content = await readFile(typeFile.path, 'utf8');
      
      console.log(chalk.green(`✅ ${typeFile.name} file exists`));
      testResults.types.typeDefinitions[typeFile.name] = { exists: true, content: content.length };
      
      // Check for required types
      const missingTypes = typeFile.requiredTypes.filter(type => 
        !content.includes(type) && !content.includes(`'${type}'`) && !content.includes(`"${type}"`)
      );
      
      if (missingTypes.length > 0) {
        console.log(chalk.red(`❌ Missing types in ${typeFile.name}: ${missingTypes.join(', ')}`));
        testResults.types.missingTypes.push(...missingTypes.map(type => `${typeFile.name}:${type}`));
      } else {
        console.log(chalk.green(`✅ All required types found in ${typeFile.name}`));
      }
      
      // Special checks for database types
      if (typeFile.name === 'Database Types') {
        testResults.types.databaseTypesExist = true;
        testResults.types.supabaseTypesGenerated = content.includes('Generated by supabase') || content.length > 1000;
      } else if (typeFile.name === 'Organization Types') {
        testResults.types.organizationTypesExist = true;
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ${typeFile.name} file missing: ${typeFile.path}`));
      testResults.types.typeDefinitions[typeFile.name] = { exists: false, error: error.message };
    }
  }
}

/**
 * Test import resolution
 */
async function testImportResolution() {
  console.log(chalk.blue('\n📦 TESTING IMPORT RESOLUTION...'));
  
  const criticalImports = [
    {
      file: 'client/src/contexts/OrganizationContext.tsx',
      imports: [
        '../integrations/supabase/client',
        '../types/organization'
      ]
    },
    {
      file: 'client/src/components/organization/OrganizationSwitcher.tsx',
      imports: [
        '../../contexts/OrganizationContext',
        '../../integrations/supabase/client'
      ]
    },
    {
      file: 'client/src/hooks/useOrganizationData.ts',
      imports: [
        '../integrations/supabase/client',
        '../types/organization'
      ]
    }
  ];
  
  for (const importTest of criticalImports) {
    try {
      await access(importTest.file);
      const content = await readFile(importTest.file, 'utf8');
      
      console.log(chalk.green(`✅ ${importTest.file} exists`));
      
      for (const importPath of importTest.imports) {
        if (content.includes(importPath)) {
          console.log(chalk.green(`  ✅ Imports ${importPath}`));
          testResults.imports.workingImports.push(`${importTest.file} -> ${importPath}`);
        } else {
          console.log(chalk.red(`  ❌ Missing import ${importPath}`));
          testResults.imports.unresolvedImports.push(`${importTest.file} -> ${importPath}`);
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ${importTest.file} missing`));
    }
  }
  
  // Check for circular dependencies
  console.log('\nChecking for circular dependencies...');
  
  try {
    const madgeOutput = execSync('npx madge --circular client/src', { 
      encoding: 'utf8',
      timeout: 30000
    });
    
    if (madgeOutput.trim()) {
      const circularDeps = madgeOutput.trim().split('\n').filter(line => line.includes('->'));
      testResults.imports.circularDependencies = circularDeps;
      
      if (circularDeps.length > 0) {
        console.log(chalk.red(`❌ Found ${circularDeps.length} circular dependencies`));
        circularDeps.forEach(dep => console.log(chalk.red(`  ${dep}`)));
      } else {
        console.log(chalk.green('✅ No circular dependencies found'));
      }
    } else {
      console.log(chalk.green('✅ No circular dependencies found'));
    }
    
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Cannot check circular dependencies: ${error.message}`));
  }
}

/**
 * Test component type compatibility
 */
async function testComponentTypes() {
  console.log(chalk.blue('\n⚛️  TESTING COMPONENT TYPE COMPATIBILITY...'));
  
  const criticalComponents = [
    'client/src/contexts/OrganizationContext.tsx',
    'client/src/components/organization/OrganizationSwitcher.tsx',
    'client/src/components/organization/ThemeCustomization.tsx',
    'client/src/components/organization/FeatureToggleManager.tsx',
    'client/src/hooks/useOrganizationData.ts'
  ];
  
  for (const componentPath of criticalComponents) {
    try {
      await access(componentPath);
      const content = await readFile(componentPath, 'utf8');
      
      console.log(chalk.green(`✅ ${componentPath} exists`));
      
      // Check for common type issues
      const issues = [];
      
      // Check for any type references
      if (content.includes('any')) {
        const anyMatches = content.match(/:\s*any/g) || [];
        if (anyMatches.length > 3) {
          issues.push(`Excessive use of 'any' type (${anyMatches.length} instances)`);
        }
      }
      
      // Check for untyped props
      if (content.includes('React.FC') && !content.includes('Props>')) {
        issues.push('React.FC used without proper props typing');
      }
      
      // Check for missing context types
      if (content.includes('useContext') && content.includes('undefined')) {
        issues.push('Context type may be undefined');
      }
      
      // Check for organization type usage
      if (componentPath.includes('organization') || componentPath.includes('Organization')) {
        if (!content.includes('Organization') && !content.includes('currentOrganization')) {
          issues.push('Organization component missing organization types');
        }
      }
      
      if (issues.length > 0) {
        console.log(chalk.yellow(`  ⚠️  Type issues:`));
        issues.forEach(issue => console.log(chalk.yellow(`    - ${issue}`)));
        testResults.components.renderingErrors.push({ file: componentPath, issues });
      } else {
        console.log(chalk.green(`  ✅ No obvious type issues`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ${componentPath} missing`));
      testResults.components.renderingErrors.push({ file: componentPath, error: error.message });
    }
  }
}

/**
 * Generate TypeScript compatibility fixes
 */
async function generateTypeFixes() {
  console.log(chalk.blue('\n🔧 GENERATING TYPE FIXES...'));
  
  const fixes = [];
  
  // Database type fixes
  if (!testResults.types.databaseTypesExist) {
    fixes.push({
      priority: 'CRITICAL',
      category: 'Database Types',
      description: 'Generate Supabase database types',
      command: 'npx supabase gen types typescript --local > client/src/integrations/supabase/types.ts',
      rationale: 'Missing database types will cause compilation failures'
    });
  }
  
  // Organization type fixes
  if (!testResults.types.organizationTypesExist) {
    fixes.push({
      priority: 'CRITICAL',
      category: 'Organization Types',
      description: 'Create organization type definitions',
      file: 'client/src/types/organization.ts',
      rationale: 'Multi-tenant functionality requires organization types'
    });
  }
  
  // Import fixes
  testResults.imports.unresolvedImports.forEach(unresolvedImport => {
    fixes.push({
      priority: 'HIGH',
      category: 'Import Resolution',
      description: `Fix unresolved import: ${unresolvedImport}`,
      rationale: 'Unresolved imports cause compilation failures'
    });
  });
  
  // Circular dependency fixes
  testResults.imports.circularDependencies.forEach(circularDep => {
    fixes.push({
      priority: 'MEDIUM',
      category: 'Circular Dependencies',
      description: `Resolve circular dependency: ${circularDep}`,
      rationale: 'Circular dependencies can cause runtime issues'
    });
  });
  
  // Critical error fixes
  testResults.typescript.criticalErrors.forEach(error => {
    fixes.push({
      priority: 'CRITICAL',
      category: 'TypeScript Errors',
      description: `Fix ${error.code}: ${error.message}`,
      file: error.file,
      line: error.line,
      rationale: 'Critical TypeScript errors prevent compilation'
    });
  });
  
  // Sort fixes by priority
  const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  fixes.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Generate fix script
  const fixScript = `#!/bin/bash
# TypeScript Type Fixes Generated by test-typescript-types.js
# Run this script after database repair to fix type compatibility issues

set -e

echo "🔧 Applying TypeScript type fixes..."

${fixes.filter(f => f.command).map(f => f.command).join('\n')}

echo "✅ Type fixes applied successfully!"
echo "Run 'npm run check' to verify TypeScript compilation"
`;
  
  await writeFile('fix-typescript-types.sh', fixScript);
  console.log(chalk.green('✅ Generated fix-typescript-types.sh'));
  
  // Generate detailed fix report
  const fixReport = {
    summary: `Generated ${fixes.length} type fixes`,
    critical: fixes.filter(f => f.priority === 'CRITICAL').length,
    high: fixes.filter(f => f.priority === 'HIGH').length,
    medium: fixes.filter(f => f.priority === 'MEDIUM').length,
    fixes: fixes
  };
  
  await writeFile('typescript-fixes.json', JSON.stringify(fixReport, null, 2));
  console.log(chalk.green('✅ Generated typescript-fixes.json'));
  
  return fixes;
}

/**
 * Generate comprehensive TypeScript report
 */
function generateTypeScriptReport() {
  console.log(chalk.blue('\n📊 TYPESCRIPT TYPE VERIFICATION REPORT'));
  console.log('='.repeat(80));
  
  // Compilation Summary
  console.log(chalk.blue('\n📋 COMPILATION SUMMARY:'));
  console.log(`TypeScript Compilation: ${testResults.typescript.compilationPasses ? chalk.green('✅ Passes') : chalk.red('❌ Fails')}`);
  console.log(`Total Errors: ${testResults.typescript.totalErrors}`);
  console.log(`Critical Errors: ${testResults.typescript.criticalErrors.length}`);
  console.log(`Fixable Errors: ${testResults.typescript.fixableErrors.length}`);
  
  // Error Breakdown by Category
  console.log(chalk.blue('\n📊 ERROR BREAKDOWN BY CATEGORY:'));
  Object.entries(testResults.typescript.errorsByCategory).forEach(([category, errors]) => {
    if (errors.length > 0) {
      console.log(`${category}: ${errors.length} errors`);
      
      // Show top 3 errors in each category
      errors.slice(0, 3).forEach(error => {
        const fileName = error.file.split('/').pop();
        console.log(chalk.gray(`  - ${fileName}:${error.line} ${error.code}: ${error.message.slice(0, 60)}...`));
      });
      
      if (errors.length > 3) {
        console.log(chalk.gray(`  ... and ${errors.length - 3} more`));
      }
    }
  });
  
  // Type Definition Summary
  console.log(chalk.blue('\n🔍 TYPE DEFINITION SUMMARY:'));
  console.log(`Database Types: ${testResults.types.databaseTypesExist ? chalk.green('✅ Exist') : chalk.red('❌ Missing')}`);
  console.log(`Organization Types: ${testResults.types.organizationTypesExist ? chalk.green('✅ Exist') : chalk.red('❌ Missing')}`);
  console.log(`Supabase Generated: ${testResults.types.supabaseTypesGenerated ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
  console.log(`Missing Types: ${testResults.types.missingTypes.length}`);
  
  if (testResults.types.missingTypes.length > 0) {
    console.log(chalk.red('Missing types:'));
    testResults.types.missingTypes.slice(0, 10).forEach(type => {
      console.log(chalk.red(`  - ${type}`));
    });
  }
  
  // Import Summary
  console.log(chalk.blue('\n📦 IMPORT RESOLUTION SUMMARY:'));
  console.log(`Working Imports: ${testResults.imports.workingImports.length}`);
  console.log(`Unresolved Imports: ${testResults.imports.unresolvedImports.length}`);
  console.log(`Circular Dependencies: ${testResults.imports.circularDependencies.length}`);
  
  // Component Summary
  console.log(chalk.blue('\n⚛️  COMPONENT TYPE SUMMARY:'));
  console.log(`Components with Issues: ${testResults.components.renderingErrors.length}`);
  
  // Critical Issues
  console.log(chalk.blue('\n🚨 CRITICAL TYPE ISSUES:'));
  const criticalIssues = [];
  
  if (!testResults.typescript.compilationPasses) {
    criticalIssues.push('❌ TypeScript compilation fails - app cannot build');
  }
  if (!testResults.types.databaseTypesExist) {
    criticalIssues.push('❌ Database types missing - database queries will fail');
  }
  if (!testResults.types.organizationTypesExist) {
    criticalIssues.push('❌ Organization types missing - multi-tenant features broken');
  }
  if (testResults.typescript.criticalErrors.length > 10) {
    criticalIssues.push(`❌ Too many critical errors (${testResults.typescript.criticalErrors.length})`);
  }
  if (testResults.imports.unresolvedImports.length > 5) {
    criticalIssues.push(`❌ Multiple unresolved imports (${testResults.imports.unresolvedImports.length})`);
  }
  
  if (criticalIssues.length === 0) {
    console.log(chalk.green('✅ No critical type issues detected'));
  } else {
    criticalIssues.forEach(issue => console.log(chalk.red(issue)));
  }
  
  // Fix Recommendations
  console.log(chalk.blue('\n💡 IMMEDIATE ACTIONS REQUIRED:'));
  
  if (!testResults.types.databaseTypesExist) {
    console.log(chalk.red('1. URGENT: Generate Supabase database types'));
    console.log(chalk.gray('   Run: npx supabase gen types typescript --local'));
  }
  
  if (!testResults.types.organizationTypesExist) {
    console.log(chalk.red('2. URGENT: Create organization type definitions'));
    console.log(chalk.gray('   Create: client/src/types/organization.ts'));
  }
  
  if (testResults.imports.unresolvedImports.length > 0) {
    console.log(chalk.yellow('3. Fix unresolved imports'));
    console.log(chalk.gray('   Check import paths and module exports'));
  }
  
  if (testResults.typescript.criticalErrors.length > 0) {
    console.log(chalk.yellow('4. Fix critical TypeScript errors'));
    console.log(chalk.gray('   Focus on TS2307 and TS2305 errors first'));
  }
  
  // Type Safety Score
  const maxScore = 100;
  const deductions = {
    compilation: testResults.typescript.compilationPasses ? 0 : 40,
    criticalErrors: Math.min(testResults.typescript.criticalErrors.length * 2, 30),
    missingTypes: Math.min(testResults.types.missingTypes.length * 3, 20),
    unresolvedImports: Math.min(testResults.imports.unresolvedImports.length * 2, 10)
  };
  
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const typeScore = Math.max(0, maxScore - totalDeductions);
  
  const scoreLevel = typeScore >= 90 ? 'Excellent' :
                    typeScore >= 70 ? 'Good' :
                    typeScore >= 50 ? 'Needs Work' :
                    'Critical Issues';
  
  console.log(chalk.blue(`\n🎯 TYPE SAFETY SCORE: ${typeScore}/100 - ${scoreLevel}`));
  
  return testResults;
}

/**
 * Main TypeScript testing execution
 */
async function main() {
  console.log(chalk.cyan('📋 TYPESCRIPT TYPE VERIFICATION & ERROR DEBUGGING'));
  console.log(chalk.cyan('================================================='));
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Node Version: ${process.version}`);
  
  // Run all TypeScript tests
  await checkTypeScriptCompilation();
  await verifyTypeDefinitions();
  await testImportResolution();
  await testComponentTypes();
  
  // Generate fixes
  const fixes = await generateTypeFixes();
  
  // Generate final report
  const results = generateTypeScriptReport();
  
  // Save detailed results to file
  await writeFile(
    'typescript-test-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log(chalk.blue('\n📋 DETAILED RESULTS SAVED TO:'));
  console.log('- typescript-test-results.json (detailed analysis)');
  console.log('- typescript-fixes.json (fix recommendations)');  
  console.log('- fix-typescript-types.sh (executable fix script)');
  
  // Exit with appropriate code
  const hasErrors = !testResults.typescript.compilationPasses ||
                   !testResults.types.databaseTypesExist ||
                   !testResults.types.organizationTypesExist ||
                   testResults.typescript.criticalErrors.length > 10;
  
  process.exit(hasErrors ? 1 : 0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run the TypeScript tests
main().catch(error => {
  console.error(chalk.red('\n❌ TypeScript test execution failed:'), error);
  process.exit(1);
});