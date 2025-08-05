
import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import NotificationService from '@/services/notificationService';

// Create a page loader component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Error boundary for lazy loading failures
class LazyBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Failed to load page</h2>
            <p className="text-muted-foreground">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Keep critical pages non-lazy for immediate loading
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

// Lazy load all other pages
const Dashboard = lazy(() => 
  import('./pages/Dashboard').then(module => ({ default: module.default }))
);

const Social = lazy(() => 
  import('./pages/Social').then(module => ({ default: module.default }))
);

const Events = lazy(() => 
  import('./pages/Events').then(module => ({ default: module.default }))
);

const Challenges = lazy(() => 
  import('./pages/Challenges').then(module => ({ default: module.default }))
);

const Messages = lazy(() => 
  import('./pages/Messages').then(module => ({ default: module.default }))
);

const Profile = lazy(() => 
  import('./pages/Profile').then(module => ({ default: module.default }))
);

const Settings = lazy(() => 
  import('./pages/Settings').then(module => ({ default: module.default }))
);

const Admin = lazy(() => 
  import('./pages/Admin').then(module => ({ default: module.default }))
);

const PerformanceMonitor = lazy(() => 
  import('./pages/admin/PerformanceMonitor').then(module => ({ default: module.default }))
);

const QRScanner = lazy(() => 
  import('./pages/QRScanner').then(module => ({ default: module.default }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize PWA features
    const initializePWA = async () => {
      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }

      // Initialize notification service
      NotificationService.getInstance().initialize();

      // Add install prompt handler
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button after 30 seconds
        setTimeout(() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
              deferredPrompt = null;
            });
          }
        }, 30000);
      });
    };

    initializePWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RealtimeProvider>
              <LazyBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/social" element={
                    <ProtectedRoute>
                      <Layout><Social /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <Layout><Events /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/challenges" element={
                    <ProtectedRoute>
                      <Layout><Challenges /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <Layout><Messages /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin>
                      <Layout><Admin /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/performance" element={
                    <ProtectedRoute requireAdmin>
                      <Layout><PerformanceMonitor /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout><Settings /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/qr-scanner" element={
                    <ProtectedRoute>
                      <Layout><QRScanner /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </LazyBoundary>
            </RealtimeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
