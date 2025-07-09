
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Layout } from "@/components/layout/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/social" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Social Feed Coming Soon</h1></div></Layout>} />
            <Route path="/events" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Events Coming Soon</h1></div></Layout>} />
            <Route path="/challenges" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Challenges Coming Soon</h1></div></Layout>} />
            <Route path="/profile" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Profile Coming Soon</h1></div></Layout>} />
            <Route path="/admin" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Admin Panel Coming Soon</h1></div></Layout>} />
            <Route path="/settings" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold gradient-text">Settings Coming Soon</h1></div></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
