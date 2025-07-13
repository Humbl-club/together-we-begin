import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Activity, Users, Target, Shield, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  // Security disabled - always redirect to dashboard for testing
  if (!loading) {
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
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-editorial-cream/80 via-editorial-sage/60 to-editorial-blush/70"></div>
        
        <div className={`relative z-10 text-center ${isMobile ? 'px-4' : ''} max-w-5xl mx-auto`}>
          <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
            <div className={`${isMobile ? 'w-12 h-12 mb-6' : 'w-16 h-16 mb-8'} mx-auto bg-editorial-charcoal rounded-xl flex items-center justify-center shadow-lg`}>
              <span className={`text-white font-light ${isMobile ? 'text-xl' : 'text-2xl'} tracking-tight`}>H</span>
            </div>
            <h1 className={`${isMobile ? 'text-2xl leading-tight' : 'text-4xl md:text-6xl lg:text-7xl'} editorial-heading mb-6 text-editorial-charcoal`}>
              HUMBL
              <span className={`block ${isMobile ? 'text-xl mt-1' : 'text-3xl md:text-5xl lg:text-6xl mt-2'} text-muted-foreground`}>Girls Club</span>
            </h1>
            <p className={`${isMobile ? 'text-sm leading-relaxed px-2' : 'text-lg md:text-xl'} text-muted-foreground ${isMobile ? 'mb-8' : 'mb-10'} max-w-2xl mx-auto font-light leading-relaxed`}>
              An exclusive wellness community for women seeking connection, growth, and inspiration in an elegant, supportive environment.
            </p>
          </div>

          <div className={`flex flex-col ${isMobile ? 'gap-4 px-4' : 'sm:flex-row gap-4'} justify-center ${isMobile ? 'mb-16' : 'mb-20'}`}>
            <Button asChild size={isMobile ? "lg" : "lg"} className={`bg-editorial-charcoal hover:bg-editorial-navy text-white ${isMobile ? 'text-base px-8 py-4 min-h-[48px]' : 'text-base px-8 py-6'} rounded-lg font-normal transition-all`}>
              <Link to="/auth">
                Join Our Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size={isMobile ? "lg" : "lg"} className={`${isMobile ? 'text-base px-8 py-4 min-h-[48px]' : 'text-base px-8 py-6'} rounded-lg font-normal border-editorial-charcoal text-editorial-charcoal hover:bg-editorial-charcoal hover:text-white transition-all`}>
              <Link to="/auth">Member Sign In</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4 mt-12 px-4' : 'md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20'}`}>
            {[
              {
                icon: Shield,
                title: 'Curated Community',
                description: 'Verified women-only space with thoughtful moderation and privacy protection'
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
              <div key={index} className={`editorial-card text-left ${isMobile ? 'p-4 min-h-[120px] active:scale-[0.98]' : 'p-6 hover:scale-[1.02]'} rounded-xl hover:shadow-lg transition-all duration-300`}>
                <div className={`${isMobile ? 'w-8 h-8 mb-3' : 'w-10 h-10 mb-4'} bg-editorial-sage rounded-lg flex items-center justify-center`}>
                  <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-editorial-charcoal`} />
                </div>
                <h3 className={`${isMobile ? 'text-sm font-semibold' : 'text-lg font-medium'} ${isMobile ? 'mb-2' : 'mb-3'} text-foreground leading-snug`}>{title}</h3>
                <p className={`${isMobile ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed'} text-muted-foreground font-light`}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;