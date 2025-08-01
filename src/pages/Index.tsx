import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Star, Crown, Sparkles } from 'lucide-react';
import exclusiveHero from '@/assets/exclusive-hero.jpg';
import luxuryAccent from '@/assets/luxury-accent.jpg';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Finally, a space that understands the caliber of woman I am.",
      author: "Executive Director, Fortune 500"
    },
    {
      quote: "This isn't just networking—it's finding your tribe at the highest level.",
      author: "Venture Partner, Top-Tier VC"
    },
    {
      quote: "Where excellence meets intention. Absolutely transformative.",
      author: "Award-Winning Entrepreneur"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
            Preparing your exclusive experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Ultra-Premium Background */}
      <div className="absolute inset-0">
        <img 
          src={exclusiveHero} 
          alt="Exclusive lifestyle" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/85 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      </div>

      {/* Floating Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground font-medium tracking-wide">LIVE — Accepting Invitations</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground/60 font-light tracking-widest">iOS EXCLUSIVE</span>
              <div className="w-px h-4 bg-border/40"></div>
              <span className="text-muted-foreground/60 font-light tracking-widest">INVITATION ONLY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusive Header */}
      <header className="relative z-40 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Star className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-display text-2xl font-light text-foreground tracking-widest">
                  HUMBL
                </div>
                <div className="text-xs text-muted-foreground/80 tracking-[0.3em] uppercase font-light">
                  Private Members Club
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground/60 tracking-[0.2em] uppercase font-light">
                Since 2024
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Verified Exclusive</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 pt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center min-h-[75vh]">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-16">
              
              {/* Exclusivity Badge */}
              <div className="inline-flex items-center space-x-4 bg-background/60 backdrop-blur-xl rounded-full px-6 py-3 border border-border/30">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm tracking-[0.2em] uppercase text-primary font-semibold">
                    Invite Only
                  </span>
                </div>
                <div className="w-px h-4 bg-border/40"></div>
                <span className="text-xs text-muted-foreground font-medium tracking-wide">
                  For the 1% of the 1%
                </span>
              </div>

              {/* Main Headlines */}
              <div className="space-y-12">
                <div className="space-y-6">
                  <h1 className="font-display font-light leading-[0.85] tracking-tight text-foreground">
                    <span className="block text-5xl md:text-6xl lg:text-7xl">
                      Where
                    </span>
                    <span className="block text-6xl md:text-7xl lg:text-8xl font-medium">
                      Extraordinary
                    </span>
                    <span className="block text-4xl md:text-5xl lg:text-6xl font-editorial italic text-muted-foreground ml-8">
                      Women Belong
                    </span>
                  </h1>
                </div>

                {/* Premium Description */}
                <div className="max-w-2xl space-y-8">
                  <p className="text-xl md:text-2xl text-muted-foreground font-editorial leading-relaxed">
                    An ultra-exclusive iOS sanctuary where accomplished women who've already made their mark come to 
                    <span className="text-foreground font-medium"> elevate each other</span> to unprecedented heights.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-display font-semibold text-foreground">500+</div>
                      <div className="text-xs text-muted-foreground tracking-wide uppercase">Exceptional Members</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-display font-semibold text-foreground">99.2%</div>
                      <div className="text-xs text-muted-foreground tracking-wide uppercase">Satisfaction Rate</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-display font-semibold text-foreground">$2.3B+</div>
                      <div className="text-xs text-muted-foreground tracking-wide uppercase">Combined Net Worth</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ultra-Premium CTA */}
              <div className="space-y-8">
                <div className="space-y-6 max-w-md">
                  <Link to="/auth?step=invite">
                    <Button 
                      size="lg" 
                      className="w-full h-16 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/95 hover:to-primary text-primary-foreground font-semibold text-lg tracking-wide transition-all duration-500 shadow-2xl shadow-primary/25 hover:shadow-primary/40 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <Crown className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      I Have My Invitation
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full h-14 border-2 border-border/60 hover:border-primary/60 bg-background/80 backdrop-blur-xl font-medium text-lg group transition-all duration-300"
                    >
                      <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Member Access
                    </Button>
                  </Link>
                </div>

                {/* Testimonial Carousel */}
                <div className="bg-background/40 backdrop-blur-xl border border-border/30 rounded-2xl p-8 max-w-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {testimonials.map((_, index) => (
                        <div 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentTestimonial ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="font-editorial text-lg italic text-foreground leading-relaxed">
                        "{testimonials[currentTestimonial].quote}"
                      </p>
                      <div className="text-sm text-muted-foreground font-medium">
                        — {testimonials[currentTestimonial].author}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Luxury Accent */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="space-y-8">
                <div className="relative">
                  <img 
                    src={luxuryAccent} 
                    alt="Luxury aesthetic" 
                    className="w-full h-80 object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-primary/10 rounded-2xl"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-background/90 backdrop-blur-xl rounded-xl p-4 border border-border/30">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-foreground">Invitation Required</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Each invitation is personally reviewed and curated by our membership committee.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exclusive Details */}
                <div className="space-y-6 text-right">
                  <div className="space-y-4">
                    <div className="w-px h-20 bg-gradient-to-b from-transparent via-border to-transparent ml-auto"></div>
                    <div className="space-y-2">
                      <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground/60 font-light">
                        Exclusively<br/>
                        Curated<br/>
                        Community
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Premium Features */}
      <section className="relative z-10 py-24 border-t border-border/20 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
              Membership Privileges
            </h2>
            <p className="text-muted-foreground font-editorial text-lg max-w-2xl mx-auto">
              Exclusive access to experiences, connections, and opportunities reserved for our distinguished members.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            
            <div className="text-center space-y-6 bg-background/80 backdrop-blur-xl rounded-2xl p-8 border border-border/30">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Elite Connections
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  Network with C-suite executives, founders, and thought leaders who shape industries.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 bg-background/80 backdrop-blur-xl rounded-2xl p-8 border border-border/30">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Exclusive Experiences
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  Private events, wellness retreats, and opportunities available nowhere else.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 bg-background/80 backdrop-blur-xl rounded-2xl p-8 border border-border/30">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Ultimate Privacy
                </h3>
                <p className="text-muted-foreground font-editorial leading-relaxed">
                  Bank-level security ensuring your privacy and discretion at the highest standard.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Exclusive Footer */}
      <footer className="relative z-10 border-t border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-display text-lg font-light tracking-widest text-foreground">HUMBL</span>
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground/70 tracking-widest uppercase font-light">
              Private Members Club — iOS Exclusive — Invitation Only — Est. 2024
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground/60">
              <span>Ultra-Private</span>
              <div className="w-px h-3 bg-border/40"></div>
              <span>Invite-Only</span>
              <div className="w-px h-3 bg-border/40"></div>
              <span>iOS Native</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;