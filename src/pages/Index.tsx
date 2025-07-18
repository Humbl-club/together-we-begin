import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Activity, Users, Target, Shield, ArrowRight, Heart, Star, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-hero">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Minimal Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full py-8 px-6 lg:py-12 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="font-display text-2xl md:text-3xl font-light text-foreground tracking-tight">
              HUMBL
              <span className="block text-sm font-normal text-muted-foreground tracking-widest uppercase -mt-1">Girls Club</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="relative z-10 px-fluid-4 pt-fluid-16 pb-fluid-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <div className="mb-20">
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extralight text-foreground leading-[0.8] tracking-tighter mb-12">
                HUMBL
                <span className="block text-foreground font-light italic">Girls Club</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto mb-16">
                An exclusive sanctuary for women who embrace growth, wellness, and authentic connection.
              </p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col gap-6 justify-center items-center max-w-sm mx-auto">
              <Button asChild size="lg" className="w-full bg-foreground text-background hover:bg-foreground/90 px-8 py-4 text-lg font-medium rounded-none transition-all duration-300 hover:scale-[1.02] shadow-none border-none">
                <Link to="/auth">
                  I have an invite code
                </Link>
              </Button>
              
              <Button asChild variant="ghost" size="lg" className="w-full text-muted-foreground hover:text-foreground hover:bg-transparent px-8 py-4 text-lg font-light rounded-none transition-all duration-300 underline underline-offset-4 decoration-1 hover:decoration-2">
                <Link to="/auth">
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-fluid-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-muted-foreground/60 tracking-widest uppercase font-light">
            HUMBL Girls Club — Est. 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;