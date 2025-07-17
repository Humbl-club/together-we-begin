import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Activity, Users, Target, Shield, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-editorial-hero overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-32 h-32 glass-card rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 glass-card rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 glass-card rounded-full opacity-35 animate-pulse delay-500"></div>
      </div>

      {/* Main Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-editorial-cream/20 via-editorial-sage/15 to-editorial-blush/20"></div>
        
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          {/* Hero Content Container */}
          <div className="text-center mb-16">
            {/* Elegant Logo */}
            <div className="relative inline-block mb-8">
              <div className="w-20 h-20 mx-auto glass-card rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-500">
                <span className="text-primary font-light text-3xl tracking-wider">H</span>
              </div>
              <div className="absolute -inset-4 glass-card rounded-full opacity-20 blur-xl"></div>
            </div>
            
            {/* Main Brand */}
            <div className="mb-8 space-y-2 px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl editorial-heading text-foreground font-extralight tracking-tight leading-tight">
                HUMBL
              </h1>
              <div className="relative">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-light tracking-wider">
                  Girls Club
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary/50 to-transparent mx-auto mt-3 rounded-full"></div>
              </div>
            </div>
            
            {/* Refined Tagline */}
            <div className="max-w-3xl mx-auto mb-12 px-6">
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed text-center">
                An exclusive wellness sanctuary for women seeking{" "}
                <span className="text-primary">connection</span>,{" "}
                <span className="text-primary">growth</span>, and{" "}
                <span className="text-primary">inspiration</span>
              </p>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Button asChild size="lg" className="glass-card bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full font-medium transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-lg border border-primary/20 w-full sm:w-auto">
                <Link to="/auth" className="flex items-center justify-center">
                  Join Our Community
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass-card border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 px-8 py-6 text-lg rounded-full font-medium transition-all duration-500 hover:scale-105 backdrop-blur-lg w-full sm:w-auto">
                <Link to="/auth">Member Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {[
              {
                icon: Shield,
                title: 'Safe Space',
                description: 'Women-only sanctuary with thoughtful moderation and complete privacy protection'
              },
              {
                icon: Users,
                title: 'Authentic Bonds',
                description: 'Connect with inspiring women who share your values and aspirations'
              },
              {
                icon: Target,
                title: 'Wellness Journey',
                description: 'Sophisticated challenges designed to elevate your mind, body, and spirit'
              },
              {
                icon: Activity,
                title: 'Personal Evolution',
                description: 'Exclusive content, events, and experiences crafted for your growth'
              }
            ].map(({ icon: Icon, title, description }, index) => (
              <div 
                key={index} 
                className="glass-card p-8 lg:p-10 rounded-3xl hover:scale-105 transition-all duration-500 group cursor-pointer hover:shadow-2xl border border-primary/10"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl lg:text-2xl font-medium mb-4 text-foreground leading-tight">{title}</h3>
                <p className="text-base lg:text-lg leading-relaxed text-muted-foreground font-light">{description}</p>
              </div>
            ))}
          </div>

          {/* Sophisticated Bottom CTA */}
          <div className="text-center mt-32 pt-16">
            <div className="relative">
              <div className="glass-card p-12 lg:p-16 rounded-[2rem] max-w-5xl mx-auto border border-primary/10 hover:border-primary/20 transition-all duration-500">
                <div className="absolute -inset-8 glass-card rounded-[2.5rem] opacity-30 blur-3xl"></div>
                <div className="relative">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl editorial-heading mb-8 text-foreground font-light leading-tight">
                    Ready to Begin Your
                    <span className="text-primary block">Journey?</span>
                  </h2>
                  <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                    Join thousands of women who have discovered their community, elevated their wellness, and transformed their lives.
                  </p>
                  <Button asChild size="lg" className="glass-card bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground px-16 py-8 text-xl rounded-full font-medium transition-all duration-500 hover:scale-105 hover:shadow-2xl border border-primary/20">
                    <Link to="/auth" className="flex items-center">
                      Start Your Journey Today
                      <ArrowRight className="w-6 h-6 ml-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;