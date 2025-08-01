import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Calendar, Trophy } from 'lucide-react';
import { MobileContainer } from '@/components/ui/mobile-container';
import { MobileTypography, MobileHeading, MobileText } from '@/components/ui/mobile-typography';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { cn } from '@/lib/utils';
import exclusiveHero from '@/assets/exclusive-hero.jpg';

const Index = () => {
  const { user, loading } = useAuth();
  const { isMobile, orientation } = useMobileFirst();

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
      <MobileContainer 
        className="min-h-screen flex items-center justify-center" 
        maxWidth="md"
        safeArea={true}
      >
        <div className="w-full text-center">
          
          {/* Glass Card */}
          <div className={cn(
            "backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl transition-all duration-300",
            isMobile 
              ? "p-8 mx-4 rounded-2xl" 
              : "p-12 rounded-3xl",
            orientation === 'landscape' && isMobile ? "py-6" : ""
          )}>
            
            {/* Logo */}
            <div className={cn("mb-8", isMobile && "mb-6")}>
              <MobileHeading 
                level={1}
                className={cn(
                  "font-display font-light tracking-wide mb-3",
                  isMobile 
                    ? "text-3xl leading-none" 
                    : "text-4xl md:text-5xl"
                )}
              >
                <span className="block">Humbl</span>
                <span className="block font-editorial italic text-primary/80 text-lg md:text-xl -mt-1">
                  Girls Club
                </span>
              </MobileHeading>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
            </div>

            {/* Description */}
            <MobileText 
              className={cn(
                "text-muted-foreground font-editorial leading-relaxed mb-8 max-w-lg mx-auto",
                isMobile ? "text-base px-2" : "text-lg"
              )}
            >
              A private community for women to connect, join exclusive events, and take on wellness challenges together.
            </MobileText>

            {/* Features */}
            <div className={cn(
              "grid grid-cols-3 gap-4 mb-10",
              isMobile ? "gap-3 mb-8" : "gap-6 mb-10"
            )}>
              <div className="space-y-3">
                <div className={cn(
                  "bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                  isMobile ? "w-12 h-12" : "w-14 h-14"
                )}>
                  <Heart className={cn(
                    "text-primary",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                </div>
                <MobileTypography 
                  variant="caption"
                  className={cn(
                    "text-muted-foreground font-medium",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  Community
                </MobileTypography>
              </div>
              <div className="space-y-3">
                <div className={cn(
                  "bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                  isMobile ? "w-12 h-12" : "w-14 h-14"
                )}>
                  <Calendar className={cn(
                    "text-primary",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                </div>
                <MobileTypography 
                  variant="caption"
                  className={cn(
                    "text-muted-foreground font-medium",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  Events
                </MobileTypography>
              </div>
              <div className="space-y-3">
                <div className={cn(
                  "bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                  isMobile ? "w-12 h-12" : "w-14 h-14"
                )}>
                  <Trophy className={cn(
                    "text-primary",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                </div>
                <MobileTypography 
                  variant="caption"
                  className={cn(
                    "text-muted-foreground font-medium",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  Challenges
                </MobileTypography>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Link to="/auth?step=invite">
                <Button 
                  size={isMobile ? "default" : "lg"}
                  className={cn(
                    "w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium backdrop-blur-sm group transition-all duration-300",
                    isMobile ? "h-12 text-base" : "h-14 text-lg"
                  )}
                >
                  Join with Invitation
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size={isMobile ? "sm" : "default"}
                  className={cn(
                    "w-full text-foreground/80 hover:text-foreground hover:bg-white/5 transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-12 text-base"
                  )}
                >
                  I'm already a member
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MobileContainer>
    </div>
  );
};

export default Index;