import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Calendar, Trophy } from 'lucide-react';
import exclusiveHero from '@/assets/exclusive-hero.jpg';

const Index = () => {
  const { user, loading } = useAuth();

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={exclusiveHero} 
          alt="Women community" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          
          {/* Glass Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">
            
            {/* Logo */}
            <div className="mb-8">
              <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-2 tracking-wide">
                Humbl Girls Club
              </h1>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground font-editorial leading-relaxed mb-8 max-w-lg mx-auto">
              A private community for women to connect, join exclusive events, and take on wellness challenges together.
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Community</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Events</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">Challenges</div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Link to="/auth?step=invite">
                <Button 
                  size="lg" 
                  className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium backdrop-blur-sm group"
                >
                  Join with Invitation
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className="w-full text-foreground/80 hover:text-foreground hover:bg-white/5"
                >
                  I'm already a member
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;