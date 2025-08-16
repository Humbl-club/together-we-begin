// Asset validation utility to ensure critical assets are loaded
export class AssetValidator {
  private static instance: AssetValidator;
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();

  static getInstance(): AssetValidator {
    if (!AssetValidator.instance) {
      AssetValidator.instance = new AssetValidator();
    }
    return AssetValidator.instance;
  }

  // Validate that critical CSS files are loaded
  validateCSSAssets(): Promise<boolean> {
    return new Promise((resolve) => {
      const checkCSS = () => {
        const stylesheets = Array.from(document.styleSheets);
        let mainCSSFound = false;

        try {
          stylesheets.forEach(sheet => {
            if (sheet.href && (sheet.href.includes('index-') || sheet.href.includes('main'))) {
              mainCSSFound = true;
              this.loadedAssets.add(sheet.href);
            }
          });

          if (!mainCSSFound) {
            console.warn('Main CSS stylesheet not found, checking for inline styles...');
            const inlineStyles = document.querySelectorAll('style');
            if (inlineStyles.length > 0) {
              mainCSSFound = true;
            }
          }

          resolve(mainCSSFound);
        } catch (error) {
          console.error('Error validating CSS assets:', error);
          resolve(false);
        }
      };

      // Check immediately and also after a short delay for async loading
      checkCSS();
      setTimeout(checkCSS, 100);
    });
  }

  // Monitor for asset loading errors
  monitorAssetErrors(): void {
    // Monitor link elements for CSS failures
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
              const link = element as HTMLLinkElement;
              link.addEventListener('error', () => {
                console.error(`Failed to load CSS: ${link.href}`);
                this.failedAssets.add(link.href);
                this.handleCSSLoadFailure(link.href);
              });

              link.addEventListener('load', () => {
                this.loadedAssets.add(link.href);
              });
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });
  }

  private handleCSSLoadFailure(href: string): void {
    if (href.includes('index-')) {
      console.warn('Main CSS failed to load, applying emergency styles');
      this.applyEmergencyStyles();
    }
  }

  private applyEmergencyStyles(): void {
    const emergencyCSS = `
      body {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #fafafa;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
      }
      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background: #0056b3;
      }
      input, textarea {
        border: 1px solid #ddd;
        padding: 0.5rem;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
      }
      .card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `;

    const style = document.createElement('style');
    style.textContent = emergencyCSS;
    style.setAttribute('data-emergency-styles', 'true');
    document.head.appendChild(style);
  }

  getLoadedAssets(): string[] {
    return Array.from(this.loadedAssets);
  }

  getFailedAssets(): string[] {
    return Array.from(this.failedAssets);
  }
}

// Initialize asset monitoring
if (typeof window !== 'undefined') {
  const validator = AssetValidator.getInstance();
  validator.monitorAssetErrors();
  
  // Check CSS on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      validator.validateCSSAssets().then(isValid => {
        if (!isValid) {
          console.warn('CSS validation failed, emergency styles may be applied');
        }
      });
    });
  } else {
    validator.validateCSSAssets();
  }
}