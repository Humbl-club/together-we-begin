import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, Shield } from 'lucide-react';
import exclusiveHero from '@/assets/exclusive-hero.jpg';

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-editorial text-lg">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={exclusiveHero} 
          alt="Professional women networking" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      </div>

      {/* Header */}
      <header className="relative z-40 pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-3">
            <div className="font-display text-3xl font-light text-foreground tracking-[0.2em]">
              HUMBL
            </div>
            <div className="text-sm text-muted-foreground tracking-wide">
              Professional Women's Community
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-16 pb-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          {/* Invitation Badge */}
          <div className="inline-flex items-center bg-primary/10 rounded-full px-6 py-2 mb-12">
            <span className="text-sm text-primary font-medium">Invitation Only</span>
          </div>

          {/* Headlines */}
          <div className="space-y-8 mb-16">
            <h1 className="font-display font-light leading-tight text-foreground">
              <span className="block text-4xl md:text-5xl lg:text-6xl mb-3">
                Where Professional
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-medium mb-4">
                Women Connect
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground font-editorial leading-relaxed max-w-3xl mx-auto">
              A thoughtfully curated community for ambitious women to network, 
              grow, and support each other's career journeys.
            </p>
          </div>

          {/* Single Quote */}
          <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-xl p-8 max-w-2xl mx-auto mb-16">
            <p className="font-editorial text-lg italic text-foreground leading-relaxed mb-4">
              "A space where authentic connections happen naturally, and professional growth feels supported."
            </p>
            <div className="text-sm text-muted-foreground">
              — Marketing Director, Tech Startup
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4 max-w-md mx-auto">
            <Link to="/auth?step=invite">
              <Button 
                size="lg" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg group"
              >
                Join with Invitation
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to="/auth">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-12 border border-border/60 hover:border-primary/40 bg-background/80 backdrop-blur-sm font-medium group"
              >
                <Shield className="w-4 h-4 mr-2" />
                Member Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 py-24 border-t border-border/20 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-light text-foreground mb-4">
              Community Benefits
            </h2>
            <p className="text-muted-foreground font-editorial text-lg max-w-2xl mx-auto">
              Connect with like-minded professionals and access opportunities for growth.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="text-center space-y-4 bg-background/60 backdrop-blur-sm rounded-xl p-8 border border-border/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Professional Network
                </h3>
                <p className="text-muted-foreground font-editorial text-sm leading-relaxed">
                  Connect with women across industries and career stages.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4 bg-background/60 backdrop-blur-sm rounded-xl p-8 border border-border/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Community Events
                </h3>
                <p className="text-muted-foreground font-editorial text-sm leading-relaxed">
                  Join professional meetups, workshops, and networking events.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4 bg-background/60 backdrop-blur-sm rounded-xl p-8 border border-border/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Safe Environment
                </h3>
                <p className="text-muted-foreground font-editorial text-sm leading-relaxed">
                  A respectful space designed with privacy and security in mind.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 bg-background/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-3">
            <span className="font-display text-lg font-light tracking-widest text-foreground">HUMBL</span>
            <p className="text-xs text-muted-foreground/70 tracking-wide">
              Professional Women's Community • Invitation Only • Est. 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;