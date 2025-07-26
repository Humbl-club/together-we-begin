
import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Layout } from "@/components/layout/Layout";
import NotificationService from "@/services/notificationService";

// Critical routes - loaded immediately
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for better performance
const Social = React.lazy(() => import("./pages/Social"));
const Events = React.lazy(() => import("./pages/Events"));
const Challenges = React.lazy(() => import("./pages/Challenges"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Admin = React.lazy(() => import("./pages/Admin"));
const PerformanceMonitor = React.lazy(() => import("./pages/admin/PerformanceMonitor"));
const QRScanner = React.lazy(() => import("./pages/QRScanner"));

// Loading component that matches Auth.tsx styling
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-editorial-hero">
    <div className="editorial-card max-w-md mx-auto text-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-muted-foreground font-light">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

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
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
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
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
