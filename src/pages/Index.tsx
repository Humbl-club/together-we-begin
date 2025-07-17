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
    <div className="min-h-screen bg-editorial-hero overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 glass-card rounded-full opacity-30 animate-float"></div>
        <div className="absolute top-[30%] right-[8%] w-24 h-24 glass-card rounded-full opacity-25 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[20%] left-[15%] w-20 h-20 glass-card rounded-full opacity-35 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[60%] right-[20%] w-16 h-16 glass-card rounded-full opacity-20 animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full py-fluid-4 px-fluid-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center">
              <span className="text-primary font-display text-xl font-semibold">H</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-foreground font-display text-lg font-medium">HUMBL</span>
              <span className="text-muted-foreground text-sm font-light ml-1">Girls Club</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="glass-button">
              <Link to="/auth">Join</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="relative z-10 px-fluid-4 pt-fluid-8 pb-fluid-12">
          <div className="max-w-7xl mx-auto text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center glass-card px-4 py-2 rounded-full mb-8 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium text-foreground">Exclusive Women's Community</span>
            </div>
            
            {/* Main Headline */}
            <div className="mb-8 max-w-4xl mx-auto">
              <h1 className="font-display text-fluid-4xl md:text-6xl lg:text-7xl font-light text-foreground leading-[0.9] tracking-tight mb-6">
                Your Sanctuary for
                <span className="block text-primary italic">Growth & Connection</span>
              </h1>
              
              <p className="text-fluid-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                Join thousands of inspiring women in an exclusive wellness community designed for 
                <span className="text-primary font-medium"> authentic connections</span>, 
                <span className="text-primary font-medium"> mindful growth</span>, and 
                <span className="text-primary font-medium"> lasting transformation</span>.
              </p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 max-w-lg mx-auto">
              <Button asChild size="lg" className="w-full sm:w-auto glass-card bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl">
                <Link to="/auth" className="flex items-center justify-center">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto glass-button px-8 py-6 text-lg rounded-xl font-medium">
                <Link to="/auth">Member Access</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-editorial-sage to-editorial-blush border-2 border-background"></div>
                  ))}
                </div>
                <span>1,000+ members</span>
              </div>
              <div className="hidden sm:flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 px-fluid-4 py-fluid-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-fluid-3xl font-light text-foreground mb-4">
                What Makes Us Different
              </h2>
              <p className="text-fluid-base text-muted-foreground max-w-2xl mx-auto">
                Every feature is thoughtfully designed to create meaningful connections and support your wellness journey.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Safe Space',
                  description: 'Women-only sanctuary with verified membership and thoughtful moderation.',
                  gradient: 'from-emerald-500/20 to-teal-500/20'
                },
                {
                  icon: Heart,
                  title: 'Authentic Bonds',
                  description: 'Connect with inspiring women through shared values and genuine conversations.',
                  gradient: 'from-pink-500/20 to-rose-500/20'
                },
                {
                  icon: Target,
                  title: 'Wellness Focus',
                  description: 'Personalized challenges and goals that fit your lifestyle and aspirations.',
                  gradient: 'from-violet-500/20 to-purple-500/20'
                },
                {
                  icon: Sparkles,
                  title: 'Growth Journey',
                  description: 'Exclusive events, masterclasses, and experiences for continuous evolution.',
                  gradient: 'from-amber-500/20 to-orange-500/20'
                }
              ].map(({ icon: Icon, title, description, gradient }, index) => (
                <div 
                  key={index} 
                  className="group glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-500 cursor-pointer border border-primary/10 hover:border-primary/20"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-medium mb-3 text-foreground">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 px-fluid-4 py-fluid-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card p-12 lg:p-16 rounded-3xl border border-primary/10">
              <div className="mb-8">
                <h2 className="font-display text-fluid-3xl font-light text-foreground mb-4">
                  Ready to Transform Your Wellness Journey?
                </h2>
                <p className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto">
                  Join our vibrant community of women who support, inspire, and grow together every day.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button asChild size="lg" className="glass-card bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-xl rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-xl">
                  <Link to="/auth" className="flex items-center justify-center">
                    Start Your Journey Today
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Link>
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Join 1,000+ women • Exclusive membership • Transform together
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-fluid-4 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 HUMBL Girls Club. Creating safe spaces for women to thrive.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;