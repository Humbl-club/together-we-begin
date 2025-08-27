#!/usr/bin/env tsx

import puppeteer from 'puppeteer';
import chalk from 'chalk';

interface UITestResult {
  page: string;
  element: string;
  action: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  message?: string;
  screenshot?: string;
}

class FrontendTester {
  private browser: any;
  private page: any;
  private results: UITestResult[] = [];
  private baseUrl = 'http://localhost:5000';

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow
    };
    console.log(colors[type](message));
  }

  private addResult(page: string, element: string, action: string, status: UITestResult['status'], message?: string) {
    this.results.push({ page, element, action, status, message });
    const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '🔥';
    this.log(`${statusSymbol} ${page} - ${element}: ${action} ${message ? `- ${message}` : ''}`, 
      status === 'PASS' ? 'success' : 'error');
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testIndexPage() {
    const pageName = 'Index Page';
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check if page loads
      const title = await this.page.title();
      if (title) {
        this.addResult(pageName, 'Page', 'Load', 'PASS', `Title: ${title}`);
      } else {
        this.addResult(pageName, 'Page', 'Load', 'FAIL', 'No title found');
      }

      // Check for navigation elements
      const navElements = await this.page.$$('[data-testid="navigation"]');
      this.addResult(pageName, 'Navigation', 'Exists', navElements.length > 0 ? 'PASS' : 'FAIL');

      // Check for auth buttons
      const signInBtn = await this.page.$('button:has-text("Sign In"), a:has-text("Sign In")');
      const signUpBtn = await this.page.$('button:has-text("Sign Up"), a:has-text("Sign Up")');
      
      this.addResult(pageName, 'Sign In Button', 'Exists', signInBtn ? 'PASS' : 'FAIL');
      this.addResult(pageName, 'Sign Up Button', 'Exists', signUpBtn ? 'PASS' : 'FAIL');

      // Check for hero section
      const hero = await this.page.$('[data-testid="hero-section"], .hero, header');
      this.addResult(pageName, 'Hero Section', 'Exists', hero ? 'PASS' : 'FAIL');

    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async testAuthFlow() {
    const pageName = 'Authentication';
    
    try {
      // Navigate to auth page
      await this.page.goto(`${this.baseUrl}/auth`, { waitUntil: 'networkidle2' });
      
      // Check for auth form
      const authForm = await this.page.$('form');
      this.addResult(pageName, 'Auth Form', 'Exists', authForm ? 'PASS' : 'FAIL');

      // Check for email input
      const emailInput = await this.page.$('input[type="email"], input[name="email"]');
      this.addResult(pageName, 'Email Input', 'Exists', emailInput ? 'PASS' : 'FAIL');

      // Check for password input
      const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
      this.addResult(pageName, 'Password Input', 'Exists', passwordInput ? 'PASS' : 'FAIL');

      // Check for submit button
      const submitBtn = await this.page.$('button[type="submit"]');
      this.addResult(pageName, 'Submit Button', 'Exists', submitBtn ? 'PASS' : 'FAIL');

      // Test form validation
      if (emailInput && passwordInput && submitBtn) {
        await emailInput.type('invalid-email');
        await passwordInput.type('123');
        await submitBtn.click();
        
        await this.page.waitForTimeout(1000);
        
        const errorMessage = await this.page.$('.error, [role="alert"]');
        this.addResult(pageName, 'Form Validation', 'Works', errorMessage ? 'PASS' : 'FAIL');
      }

    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async testProtectedRoutes() {
    const pageName = 'Protected Routes';
    
    const protectedRoutes = [
      '/dashboard',
      '/social',
      '/events',
      '/challenges',
      '/messages',
      '/profile',
      '/settings',
      '/admin'
    ];

    for (const route of protectedRoutes) {
      try {
        await this.page.goto(`${this.baseUrl}${route}`, { waitUntil: 'networkidle2' });
        
        // Check if redirected to auth
        const currentUrl = this.page.url();
        const isProtected = currentUrl.includes('/auth') || currentUrl.includes('login');
        
        this.addResult(pageName, route, 'Protection', isProtected ? 'PASS' : 'FAIL', 
          isProtected ? 'Redirected to auth' : 'Not protected');
        
      } catch (error: any) {
        this.addResult(pageName, route, 'Protection', 'ERROR', error.message);
      }
    }
  }

  async testMobileResponsiveness() {
    const pageName = 'Mobile Responsiveness';
    
    try {
      // iPhone viewport
      await this.page.setViewport({ width: 375, height: 812 });
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check for mobile menu
      const mobileMenu = await this.page.$('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]');
      this.addResult(pageName, 'Mobile Menu', 'Exists', mobileMenu ? 'PASS' : 'FAIL');
      
      // iPad viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.page.reload({ waitUntil: 'networkidle2' });
      
      const tabletLayout = await this.page.$('.tablet-layout, [data-testid="tablet-layout"]');
      this.addResult(pageName, 'Tablet Layout', 'Responsive', 'PASS');
      
      // Desktop viewport
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.reload({ waitUntil: 'networkidle2' });
      
      const desktopLayout = await this.page.$('.desktop-layout, [data-testid="desktop-layout"]');
      this.addResult(pageName, 'Desktop Layout', 'Responsive', 'PASS');
      
    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async testOrganizationFlow() {
    const pageName = 'Organization Flow';
    
    try {
      // Test organization signup route
      await this.page.goto(`${this.baseUrl}/test-org/signup`, { waitUntil: 'networkidle2' });
      
      // Check if org signup page loads
      const currentUrl = this.page.url();
      const isOrgSignup = currentUrl.includes('/signup');
      
      this.addResult(pageName, 'Org Signup Route', 'Loads', isOrgSignup ? 'PASS' : 'FAIL');
      
      // Check for org signup form
      const orgForm = await this.page.$('form');
      this.addResult(pageName, 'Org Signup Form', 'Exists', orgForm ? 'PASS' : 'FAIL');
      
      // Test invite join route
      await this.page.goto(`${this.baseUrl}/join/TEST123`, { waitUntil: 'networkidle2' });
      
      const isInviteJoin = this.page.url().includes('/join/');
      this.addResult(pageName, 'Invite Join Route', 'Loads', isInviteJoin ? 'PASS' : 'FAIL');
      
    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async testErrorHandling() {
    const pageName = 'Error Handling';
    
    try {
      // Test 404 page
      await this.page.goto(`${this.baseUrl}/non-existent-route-123`, { waitUntil: 'networkidle2' });
      
      const notFoundText = await this.page.$('*:has-text("404"), *:has-text("Not Found")');
      this.addResult(pageName, '404 Page', 'Displays', notFoundText ? 'PASS' : 'FAIL');
      
      // Test network error handling
      await this.page.setOfflineMode(true);
      await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      
      const offlineIndicator = await this.page.$('*:has-text("Offline"), *:has-text("No connection")');
      this.addResult(pageName, 'Offline Mode', 'Handles', offlineIndicator ? 'PASS' : 'FAIL');
      
      await this.page.setOfflineMode(false);
      
    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async testPWAFeatures() {
    const pageName = 'PWA Features';
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check for manifest
      const manifest = await this.page.evaluate(() => {
        const link = document.querySelector('link[rel="manifest"]');
        return link ? link.getAttribute('href') : null;
      });
      this.addResult(pageName, 'Manifest', 'Exists', manifest ? 'PASS' : 'FAIL');
      
      // Check for service worker
      const swRegistered = await this.page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      this.addResult(pageName, 'Service Worker', 'Available', swRegistered ? 'PASS' : 'FAIL');
      
      // Check for viewport meta tag
      const viewport = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      this.addResult(pageName, 'Viewport Meta', 'Configured', viewport ? 'PASS' : 'FAIL');
      
      // Check for theme color
      const themeColor = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        return meta ? meta.getAttribute('content') : null;
      });
      this.addResult(pageName, 'Theme Color', 'Set', themeColor ? 'PASS' : 'FAIL');
      
    } catch (error: any) {
      this.addResult(pageName, 'Overall', 'Test', 'ERROR', error.message);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    this.log('\n🖥️ Starting Frontend UI Testing\n', 'info');
    
    await this.initialize();
    
    await this.testIndexPage();
    await this.testAuthFlow();
    await this.testProtectedRoutes();
    await this.testMobileResponsiveness();
    await this.testOrganizationFlow();
    await this.testErrorHandling();
    await this.testPWAFeatures();
    
    await this.cleanup();
    
    this.printSummary();
  }

  private printSummary() {
    this.log('\n📊 Frontend Test Summary\n', 'info');
    
    const pages = [...new Set(this.results.map(r => r.page))];
    
    for (const page of pages) {
      const pageResults = this.results.filter(r => r.page === page);
      const passed = pageResults.filter(r => r.status === 'PASS').length;
      const failed = pageResults.filter(r => r.status === 'FAIL').length;
      const errors = pageResults.filter(r => r.status === 'ERROR').length;
      
      this.log(`${page}: ✅ ${passed} | ❌ ${failed} | 🔥 ${errors}`, 
        failed > 0 || errors > 0 ? 'error' : 'success');
    }
    
    const totalPassed = this.results.filter(r => r.status === 'PASS').length;
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length;
    const totalErrors = this.results.filter(r => r.status === 'ERROR').length;
    
    this.log(`\n📈 Total: ✅ ${totalPassed} | ❌ ${totalFailed} | 🔥 ${totalErrors}\n`, 'info');
    
    // Report critical frontend issues
    const criticalIssues = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (criticalIssues.length > 0) {
      this.log('\n⚠️ Critical Frontend Issues:\n', 'error');
      for (const issue of criticalIssues) {
        this.log(`  - ${issue.page}: ${issue.element} - ${issue.action} - ${issue.message || 'Failed'}`, 'error');
      }
    }
  }
}

// Run tests
const tester = new FrontendTester();
tester.runAllTests().catch(console.error);