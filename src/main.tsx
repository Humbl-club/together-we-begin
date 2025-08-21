import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register } from './utils/serviceWorkerRegistration'
import { AssetValidator } from './utils/assetValidator'

// Capacitor debugging
declare global {
  interface Window {
    capacitorDebug: {
      log: (message: string, type?: string) => void;
      logs: Array<{ timestamp: string; message: string; type: string }>;
    };
    hideCapacitorLoading: () => void;
    showCapacitorError: (error: string) => void;
  }
}

// Critical CSS fallback to prevent complete style loss
const addCriticalCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    body { font-family: system-ui, sans-serif; background: #fafafa; color: #333; }
    .fallback-styles { opacity: 1 !important; }
  `;
  document.head.appendChild(style);
};

// Check if main CSS file loaded successfully
const checkCSSLoaded = () => {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  let mainCSSLoaded = false;
  
  links.forEach(link => {
    const linkElement = link as HTMLLinkElement;
    if (linkElement.href && linkElement.href.includes('index-') && linkElement.href.includes('.css')) {
      mainCSSLoaded = true;
    }
  });
  
  if (!mainCSSLoaded) {
    console.warn('Main CSS file not detected, applying fallback styles');
    addCriticalCSS();
  }
};

// Wait for DOM to be ready before checking CSS
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkCSSLoaded);
} else {
  checkCSSLoaded();
}

// Enhanced initialization with error handling
const initializeApp = async () => {
  try {
    window.capacitorDebug?.log('Starting React app initialization...');
    
    // Validate critical assets
    try {
      const validator = AssetValidator.getInstance();
      const cssValid = await validator.validateCSSAssets();
      if (cssValid) {
        window.capacitorDebug?.log('Critical assets validated');
      } else {
        window.capacitorDebug?.log('CSS validation failed, but continuing', 'warn');
      }
    } catch (assetError) {
      console.warn('Asset validation failed:', assetError);
      window.capacitorDebug?.log('Asset validation failed, continuing anyway', 'warn');
    }
    
    // Create and render the app
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    window.capacitorDebug?.log('Creating React root...');
    const root = createRoot(rootElement);
    
    window.capacitorDebug?.log('Rendering App component...');
    root.render(<App />);
    
    // Hide Capacitor loading screen after successful render
    setTimeout(() => {
      window.capacitorDebug?.log('App rendered successfully');
      window.hideCapacitorLoading?.();
    }, 1000);
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    window.capacitorDebug?.log(`App initialization failed: ${error}`, 'error');
    window.showCapacitorError?.(`Initialization failed: ${error}`);
  }
};

// Initialize the app
initializeApp();

// Register service worker with proper error handling
if (process.env.NODE_ENV === 'production') {
  register({
    onSuccess: () => {
      console.log('Service worker registered successfully');
    },
    onUpdate: () => {
      console.log('New content available; please refresh');
    }
  });
}
