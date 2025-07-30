import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register } from './utils/serviceWorkerRegistration'

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
