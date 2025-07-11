
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, Users, Trophy, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  // Security disabled - always redirect to dashboard for testing
  if (!loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-4xl">H</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-6">
              HUMBL Girls Club
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A safe, empowering space for women to connect, grow, and inspire each other. 
              Join our exclusive community today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-2xl">
              <Link to="/auth">Join the Community</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl glass-button">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {[
              {
                icon: Heart,
                title: 'Safe Space',
                description: 'Women-only community with strict verification and moderation'
              },
              {
                icon: Users,
                title: 'Connect',
                description: 'Build meaningful friendships with like-minded women'
              },
              {
                icon: Trophy,
                title: 'Challenges',
                description: 'Fun wellness and fitness challenges with rewards'
              },
              {
                icon: Shield,
                title: 'Privacy First',
                description: 'Your data and conversations are protected and secure'
              }
            ].map(({ icon: Icon, title, description }, index) => (
              <div key={index} className="floating-card text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
