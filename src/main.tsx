import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register } from './utils/serviceWorkerRegistration'
import { AssetValidator } from './utils/assetValidator'

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

createRoot(document.getElementById("root")!).render(<App />);

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
