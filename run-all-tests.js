/**
 * COMPREHENSIVE TEST RUNNER
 * 
 * Executes all database and integration tests in the correct order.
 * This is the master test suite that should be run to verify the current
 * state and after database repair.
 * 
 * Usage: node run-all-tests.js [--post-repair]
 */

import { spawn, execSync } from 'child_process';
import { writeFile } from 'fs/promises';
import chalk from 'chalk';

// Test configuration
const TEST_SUITE_CONFIG = {
  preRepair: [
    {
      name: 'Database State Verification',
      script: 'test-database-state.js',
      description: 'Verifies current database state and identifies missing tables/functions',
      critical: true,
      timeout: 120000
    },
    {
      name: 'TypeScript Type Verification', 
      script: 'test-typescript-types.js',
      description: 'Analyzes TypeScript errors and generates type fixes',
      critical: true,
      timeout: 180000
    },
    {
      name: 'Database Connectivity',
      script: 'test-database-connectivity.js', 
      description: 'Tests Node.js and React database connectivity',
      critical: true,
      timeout: 90000
    },
    {
      name: 'Multi-Tenant Integration',
      script: 'test-multitenant-integration.js',
      description: 'Tests multi-tenant architecture integration',
      critical: false,
      timeout: 120000
    }
  ],
  postRepair: [
    {
      name: 'Post-Repair Validation',
      script: 'test-post-repair-validation.js',
      description: 'Comprehensive validation after database repair',
      critical: true,
      timeout: 300000
    },
    {
      name: 'Database State Verification (Post-Repair)',
      script: 'test-database-state.js',
      description: 'Verifies all tables and functions exist after repair',
      critical: true,
      timeout: 120000
    },
    {
      name: 'Multi-Tenant Integration (Post-Repair)',
      script: 'test-multitenant-integration.js',
      description: 'Tests complete multi-tenant functionality',
      critical: true,
      timeout: 120000
    },
    {
      name: 'TypeScript Compilation',
      script: 'test-typescript-types.js',
      description: 'Verifies TypeScript compilation passes',
      critical: true,
      timeout: 180000
    },
    {
      name: 'Database Connectivity (Final)',
      script: 'test-database-connectivity.js',
      description: 'Final connectivity verification',
      critical: true,
      timeout: 90000
    }
  ]
};

// Global test results
let masterResults = {
  startTime: new Date().toISOString(),
  mode: 'pre-repair',
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  criticalFailures: 0,
  testResults: {},
  overallStatus: 'UNKNOWN',
  recommendations: [],
  nextSteps: []
};

/**
 * Execute a single test script
 */
async function executeTest(testConfig) {
  console.log(chalk.blue(`\n${'='.repeat(80)}`));
  console.log(chalk.blue(`🧪 RUNNING: ${testConfig.name}`));
  console.log(chalk.gray(`Description: ${testConfig.description}`));
  console.log(chalk.gray(`Script: ${testConfig.script}`));
  console.log(chalk.gray(`Critical: ${testConfig.critical ? 'YES' : 'NO'}`));
  console.log(chalk.blue(`${'='.repeat(80)}`));
  
  const testResult = {
    name: testConfig.name,
    script: testConfig.script,
    startTime: Date.now(),
    endTime: null,
    duration: 0,
    exitCode: null,
    stdout: '',
    stderr: '',
    success: false,
    critical: testConfig.critical,
    skipped: false,
    error: null
  };
  
  try {
    const startTime = Date.now();
    
    // Execute the test script
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [testConfig.script], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: testConfig.timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });
      
      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Real-time error output
      });
      
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', (error) => {
        reject(error);
      });
      
      // Handle timeout
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Test timeout after ${testConfig.timeout}ms`));
      }, testConfig.timeout);
    });
    
    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - startTime;
    testResult.exitCode = result.code;
    testResult.stdout = result.stdout;
    testResult.stderr = result.stderr;
    testResult.success = result.code === 0;
    
    if (testResult.success) {
      console.log(chalk.green(`\n✅ ${testConfig.name} PASSED (${testResult.duration}ms)`));
      masterResults.passedTests++;
    } else {
      console.log(chalk.red(`\n❌ ${testConfig.name} FAILED (${testResult.duration}ms, exit code: ${result.code})`));
      masterResults.failedTests++;
      
      if (testConfig.critical) {
        masterResults.criticalFailures++;
        console.log(chalk.red(`⚠️  CRITICAL TEST FAILED`));
      }
    }
    
  } catch (error) {
    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - testResult.startTime;
    testResult.error = error.message;
    testResult.success = false;
    
    console.log(chalk.red(`\n❌ ${testConfig.name} FAILED WITH ERROR: ${error.message}`));
    masterResults.failedTests++;
    
    if (testConfig.critical) {
      masterResults.criticalFailures++;
      console.log(chalk.red(`⚠️  CRITICAL TEST FAILED WITH ERROR`));
    }
  }
  
  masterResults.testResults[testConfig.name] = testResult;
  masterResults.totalTests++;
  
  return testResult;
}

/**
 * Determine test mode and configuration
 */
function determineTestMode() {
  const args = process.argv.slice(2);
  
  if (args.includes('--post-repair')) {
    console.log(chalk.blue('🔧 Running in POST-REPAIR mode'));
    return 'postRepair';
  } else {
    console.log(chalk.blue('🔍 Running in PRE-REPAIR mode'));
    return 'preRepair';
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations() {
  console.log(chalk.blue('\n💡 GENERATING RECOMMENDATIONS...'));
  
  const recommendations = [];
  const nextSteps = [];
  
  // Analyze critical failures
  if (masterResults.criticalFailures > 0) {
    recommendations.push('🚨 URGENT: Fix critical test failures before proceeding');
    nextSteps.push('Address critical failures immediately');
  }
  
  // Analyze specific test failures
  Object.entries(masterResults.testResults).forEach(([testName, result]) => {
    if (!result.success && result.critical) {
      switch (result.script) {
        case 'test-database-state.js':
          recommendations.push('🔧 Run database repair migration to create missing tables');
          nextSteps.push('Execute: npm run db:repair');
          break;
          
        case 'test-typescript-types.js':
          recommendations.push('📋 Fix TypeScript compilation errors');
          nextSteps.push('Run: bash fix-typescript-types.sh');
          break;
          
        case 'test-database-connectivity.js':
          recommendations.push('🔗 Fix database connectivity issues');
          nextSteps.push('Check Supabase configuration and network');
          break;
          
        case 'test-multitenant-integration.js':
          recommendations.push('🏢 Fix multi-tenant integration issues');
          nextSteps.push('Verify organization context and data isolation');
          break;
          
        case 'test-post-repair-validation.js':
          recommendations.push('✅ Complete database repair process');
          nextSteps.push('Re-run repair validation after fixes');
          break;
      }
    }
  });
  
  // Mode-specific recommendations
  if (masterResults.mode === 'preRepair') {
    if (masterResults.criticalFailures === 0) {
      recommendations.push('✅ Ready to proceed with database repair');
      nextSteps.push('Run database repair migration');
      nextSteps.push('Re-run tests with --post-repair flag');
    } else {
      recommendations.push('⚠️  Fix issues before attempting database repair');
    }
  } else {
    if (masterResults.criticalFailures === 0) {
      recommendations.push('🎉 Platform ready for production');
      nextSteps.push('Deploy to production environment');
      nextSteps.push('Set up monitoring and alerts');
    } else {
      recommendations.push('🔧 Additional fixes needed after repair');
      nextSteps.push('Address remaining issues');
    }
  }
  
  masterResults.recommendations = recommendations;
  masterResults.nextSteps = nextSteps;
}

/**
 * Generate comprehensive test report
 */
async function generateMasterReport() {
  console.log(chalk.blue('\n📊 COMPREHENSIVE TEST REPORT'));
  console.log('='.repeat(80));
  
  // Determine overall status
  if (masterResults.criticalFailures === 0 && masterResults.failedTests === 0) {
    masterResults.overallStatus = 'ALL TESTS PASSED';
  } else if (masterResults.criticalFailures === 0) {
    masterResults.overallStatus = 'MINOR ISSUES';
  } else {
    masterResults.overallStatus = 'CRITICAL ISSUES';
  }
  
  // Test execution summary
  console.log(chalk.blue('\n📋 EXECUTION SUMMARY:'));
  console.log(`Mode: ${masterResults.mode.toUpperCase()}`);
  console.log(`Total Tests: ${masterResults.totalTests}`);
  console.log(`Passed: ${chalk.green(masterResults.passedTests)}`);
  console.log(`Failed: ${chalk.red(masterResults.failedTests)}`);
  console.log(`Critical Failures: ${chalk.red(masterResults.criticalFailures)}`);
  console.log(`Overall Status: ${masterResults.overallStatus}`);
  
  // Individual test results
  console.log(chalk.blue('\n🧪 INDIVIDUAL TEST RESULTS:'));
  
  Object.entries(masterResults.testResults).forEach(([testName, result]) => {
    const status = result.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    const critical = result.critical ? chalk.red(' [CRITICAL]') : '';
    const duration = `${result.duration}ms`;
    
    console.log(`${status} ${testName}${critical} (${duration})`);
    
    if (!result.success && result.error) {
      console.log(chalk.red(`   Error: ${result.error}`));
    }
  });
  
  // Performance metrics
  console.log(chalk.blue('\n⚡ PERFORMANCE METRICS:'));
  const totalDuration = Object.values(masterResults.testResults)
    .reduce((sum, result) => sum + result.duration, 0);
  const averageDuration = totalDuration / masterResults.totalTests;
  
  console.log(`Total Execution Time: ${totalDuration}ms`);
  console.log(`Average Test Duration: ${Math.round(averageDuration)}ms`);
  
  // Show slowest tests
  const sortedByDuration = Object.entries(masterResults.testResults)
    .sort(([,a], [,b]) => b.duration - a.duration)
    .slice(0, 3);
  
  console.log('\nSlowest Tests:');
  sortedByDuration.forEach(([name, result]) => {
    console.log(chalk.gray(`  ${name}: ${result.duration}ms`));
  });
  
  // Recommendations
  console.log(chalk.blue('\n💡 RECOMMENDATIONS:'));
  masterResults.recommendations.forEach(rec => {
    console.log(rec);
  });
  
  // Next steps
  console.log(chalk.blue('\n🚀 NEXT STEPS:'));
  masterResults.nextSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  
  // Critical issues warning
  if (masterResults.criticalFailures > 0) {
    console.log(chalk.red('\n🚨 CRITICAL ISSUES DETECTED'));
    console.log(chalk.red('The platform is NOT ready for production.'));
    console.log(chalk.red('Address critical failures before proceeding.'));
  } else if (masterResults.failedTests > 0) {
    console.log(chalk.yellow('\n⚠️  MINOR ISSUES DETECTED'));
    console.log(chalk.yellow('Platform may work but consider fixing issues.'));
  } else {
    console.log(chalk.green('\n🎉 ALL TESTS PASSED'));
    console.log(chalk.green('Platform is ready for the next phase.'));
  }
  
  // Save comprehensive results
  const reportData = {
    ...masterResults,
    endTime: new Date().toISOString(),
    summary: {
      status: masterResults.overallStatus,
      readyForProduction: masterResults.criticalFailures === 0 && masterResults.failedTests === 0,
      criticalIssues: masterResults.criticalFailures,
      minorIssues: masterResults.failedTests - masterResults.criticalFailures,
      totalDuration,
      averageDuration: Math.round(averageDuration)
    }
  };
  
  await writeFile(
    'comprehensive-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log(chalk.blue('\n📋 COMPREHENSIVE RESULTS SAVED TO: comprehensive-test-results.json'));
  
  return reportData;
}

/**
 * Main test runner execution
 */
async function main() {
  console.log(chalk.cyan('🧪 COMPREHENSIVE DATABASE & INTEGRATION TEST SUITE'));
  console.log(chalk.cyan('==================================================='));
  console.log(`Start Time: ${masterResults.startTime}`);
  console.log(`Environment: Node.js ${process.version} on ${process.platform}`);
  console.log(`Working Directory: ${process.cwd()}`);
  
  // Determine test mode
  const mode = determineTestMode();
  masterResults.mode = mode;
  
  // Get test configuration
  const testSuite = TEST_SUITE_CONFIG[mode];
  
  console.log(chalk.blue(`\n📋 EXECUTING ${testSuite.length} TESTS IN ${mode.toUpperCase()} MODE:`));
  testSuite.forEach((test, index) => {
    const critical = test.critical ? chalk.red('[CRITICAL]') : chalk.gray('[OPTIONAL]');
    console.log(`${index + 1}. ${test.name} ${critical}`);
  });
  
  console.log(chalk.blue('\nStarting test execution...\n'));
  
  // Execute all tests in sequence
  for (const testConfig of testSuite) {
    await executeTest(testConfig);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate recommendations
  generateRecommendations();
  
  // Generate final report
  const finalResults = await generateMasterReport();
  
  // Exit with appropriate code
  const exitCode = masterResults.criticalFailures > 0 ? 1 : 0;
  
  console.log(chalk.blue(`\n🏁 Test suite completed with exit code: ${exitCode}`));
  
  process.exit(exitCode);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error in test runner:'), error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⚠️  Test execution interrupted by user'));
  process.exit(130);
});

// Run the comprehensive test suite
main().catch(error => {
  console.error(chalk.red('\n❌ Test runner execution failed:'), error);
  process.exit(1);
});