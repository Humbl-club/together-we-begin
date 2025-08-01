import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import abstractAccent from '@/assets/abstract-accent.jpg';

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-light">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBackground} 
          alt="Hero background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">H</span>
              </div>
              <div className="font-display text-xl font-light text-foreground tracking-widest">
                HUMBL
              </div>
            </div>
            <div className="text-xs text-muted-foreground/60 tracking-[0.2em] uppercase font-light">
              Est. 2024
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[80vh]">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 lg:col-start-2 space-y-12">
              
              {/* Editorial Tag */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-px bg-foreground/40"></div>
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium">
                  Exclusive Community
                </span>
              </div>

              {/* Main Headlines */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="font-display font-light leading-[0.85] tracking-tight">
                    <span className="block text-6xl md:text-7xl lg:text-8xl text-foreground">
                      A Space
                    </span>
                    <span className="block text-4xl md:text-5xl lg:text-6xl text-muted-foreground font-editorial italic ml-4 md:ml-8">
                      for the
                    </span>
                    <span className="block text-6xl md:text-7xl lg:text-8xl text-foreground">
                      Extraordinary
                    </span>
                  </h1>
                </div>

                {/* Subheading */}
                <div className="max-w-lg space-y-6">
                  <p className="text-lg md:text-xl text-muted-foreground font-editorial leading-relaxed">
                    Where accomplished women gather to inspire, support, and elevate each other through meaningful connections and shared growth.
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-6">
                <div className="space-y-4 max-w-sm">
                  <Link to="/auth?step=invite">
                    <Button 
                      size="lg" 
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium tracking-wide transition-all duration-300 group"
                    >
                      I have an invitation
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full h-12 border-border/60 hover:border-primary/60 bg-background/60 backdrop-blur-sm font-medium"
                    >
                      Member Sign In
                    </Button>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-8 text-xs text-muted-foreground/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500/60 rounded-full"></div>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500/60 rounded-full"></div>
                    <span>Private</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500/60 rounded-full"></div>
                    <span>Invitation Only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Column */}
            <div className="lg:col-span-4 lg:col-start-10 hidden lg:block">
              <div className="space-y-12">
                
                {/* Abstract Accent Image */}
                <div className="relative">
                  <img 
                    src={abstractAccent} 
                    alt="Abstract accent" 
                    className="w-full h-64 object-cover rounded-lg opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 to-transparent rounded-lg"></div>
                </div>

                {/* Editorial Sidebar Content */}
                <div className="space-y-8 text-right">
                  <div className="space-y-4">
                    <div className="w-px h-16 bg-foreground/20 ml-auto"></div>
                    <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground/60 font-light leading-relaxed">
                      Curated<br/>
                      Community<br/>
                      of Purpose
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-editorial text-muted-foreground leading-relaxed">
                      "Excellence recognizes excellence. This is where 
                      intentional women build something beautiful together."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block">
          <div className="flex flex-col items-center space-y-2 text-muted-foreground/40">
            <span className="text-xs tracking-[0.2em] uppercase font-light">Discover</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            
            <div className="text-center space-y-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-medium text-foreground">
                  Meaningful Connections
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  Connect with women who share your values, ambitions, and commitment to growth.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-medium text-foreground">
                  Wellness & Growth
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  Participate in challenges and activities designed to nurture your wellbeing.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-medium text-foreground">
                  Safe Environment
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  A carefully curated space where authenticity and support flourish.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-xs text-muted-foreground/60 tracking-widest uppercase font-light">
              HUMBL — Membership by Invitation Only — Est. 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;