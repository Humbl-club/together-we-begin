
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Layout } from "@/components/layout/Layout";
import NotificationService from "@/services/notificationService";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Social from "./pages/Social";
import Events from "./pages/Events";
import Challenges from "./pages/Challenges";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/social" element={<Layout><Social /></Layout>} />
                <Route path="/events" element={<Layout><Events /></Layout>} />
                <Route path="/challenges" element={<Layout><Challenges /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/admin" element={<Layout><Admin /></Layout>} />
                <Route path="/settings" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Settings Coming Soon</h1></div></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
