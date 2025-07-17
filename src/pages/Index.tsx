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
    <div className="min-h-screen bg-editorial-hero">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-editorial-cream/30 via-editorial-sage/20 to-editorial-blush/25"></div>
        
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          {/* Main Hero Content */}
          <div className="text-center mb-16">
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-8 glass-card rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-primary font-light text-3xl tracking-tight">H</span>
            </div>
            
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl editorial-heading mb-4 text-foreground font-light">
                HUMBL
              </h1>
              <p className="text-2xl md:text-4xl lg:text-5xl text-muted-foreground font-light tracking-wide">
                Girls Club
              </p>
            </div>
            
            {/* Tagline */}
            <div className="max-w-3xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                An exclusive wellness community for women seeking connection, growth, and inspiration in an elegant, supportive environment.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Button asChild size="lg" className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground px-10 py-6 text-lg rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                <Link to="/auth">
                  Join Our Community
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass-card border-primary/30 text-primary hover:bg-primary/10 px-10 py-6 text-lg rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                <Link to="/auth">Member Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Curated Community',
                description: 'Women-only space with thoughtful moderation and privacy protection'
              },
              {
                icon: Users,
                title: 'Meaningful Connections',
                description: 'Build authentic relationships with inspiring women who share your values'
              },
              {
                icon: Target,
                title: 'Wellness Journey',
                description: 'Engage in sophisticated challenges that elevate your mind, body, and spirit'
              },
              {
                icon: Activity,
                title: 'Personal Growth',
                description: 'Access exclusive content, events, and experiences designed for your development'
              }
            ].map(({ icon: Icon, title, description }, index) => (
              <div 
                key={index} 
                className="glass-card p-8 rounded-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-4 text-foreground leading-tight">{title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground font-light">{description}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA Section */}
          <div className="text-center mt-24 pt-12 border-t border-border/30">
            <div className="glass-card p-12 rounded-3xl max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl editorial-heading mb-6 text-foreground font-light">
                Ready to Begin Your Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                Join thousands of women who have discovered their community, elevated their wellness, and transformed their lives.
              </p>
              <Button asChild size="lg" className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground px-12 py-6 text-lg rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02]">
                <Link to="/auth">
                  Start Your Journey Today
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;