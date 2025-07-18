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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden relative">
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-[15%] left-[8%] w-3 h-3 bg-primary/30 rounded-full animate-float"></div>
        <div className="absolute top-[25%] right-[12%] w-2 h-2 bg-accent/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[30%] left-[15%] w-4 h-4 bg-primary/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[60%] right-[25%] w-2 h-2 bg-accent/30 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full py-6 px-6 lg:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg border border-primary/20 backdrop-blur-sm">
              <span className="text-primary-foreground font-display text-2xl font-bold tracking-tight">H</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl font-bold text-foreground tracking-tight">HUMBL</div>
              <div className="text-muted-foreground text-sm font-medium tracking-wide -mt-1">Girls Club</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="default" className="hidden sm:inline-flex text-foreground/80 hover:text-foreground hover:bg-primary/5 font-medium">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="default" className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl border border-primary/20 transition-all duration-300 hover:scale-105">
              <Link to="/auth">Join Club</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="relative z-10 px-fluid-4 pt-fluid-16 pb-fluid-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <div className="mb-16">
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extralight text-foreground leading-[0.85] tracking-tighter mb-8">
                HUMBL
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-light italic">Girls Club</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground/80 font-light leading-relaxed max-w-2xl mx-auto">
                An exclusive sanctuary for women who embrace growth, wellness, and authentic connection.
              </p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto">
              <Button asChild size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg border border-primary/20">
                <Link to="/auth">
                  I have an invite code
                </Link>
              </Button>
              
              <Button asChild variant="ghost" size="lg" className="w-full text-muted-foreground hover:text-foreground hover:bg-primary/5 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300">
                <Link to="/auth">
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-fluid-4 py-12 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground tracking-wide">
            © 2024 HUMBL Girls Club. Creating safe spaces for women to thrive.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;