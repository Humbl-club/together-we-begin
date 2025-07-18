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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden relative">
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-[15%] left-[8%] w-3 h-3 bg-primary/30 rounded-full animate-float"></div>
        <div className="absolute top-[25%] right-[12%] w-2 h-2 bg-accent/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[30%] left-[15%] w-4 h-4 bg-primary/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[60%] right-[25%] w-2 h-2 bg-accent/30 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full py-6 px-6 lg:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg border border-primary/20 backdrop-blur-sm">
              <span className="text-primary-foreground font-display text-2xl font-bold tracking-tight">H</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl font-bold text-foreground tracking-tight">HUMBL</div>
              <div className="text-muted-foreground text-sm font-medium tracking-wide -mt-1">Girls Club</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="default" className="hidden sm:inline-flex text-foreground/80 hover:text-foreground hover:bg-primary/5 font-medium">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="default" className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl border border-primary/20 transition-all duration-300 hover:scale-105">
              <Link to="/auth">Join Club</Link>
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
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-xl px-8 py-4 rounded-full mb-12 border border-primary/30 shadow-2xl">
              <Sparkles className="w-5 h-5 text-primary mr-3 animate-pulse" />
              <span className="text-base font-semibold text-foreground tracking-wide">Exclusive Women's Community</span>
            </div>
            
            {/* Main Headline */}
            <div className="mb-16 max-w-5xl mx-auto">
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight text-foreground leading-[0.85] tracking-tighter mb-8">
                Your Sanctuary for
                <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent font-medium italic">Growth & Connection</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground/90 font-light leading-relaxed max-w-3xl mx-auto tracking-wide">
                Join thousands of inspiring women in an exclusive wellness community designed for 
                <span className="text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> authentic connections</span>, 
                <span className="text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> mindful growth</span>, and 
                <span className="text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> lasting transformation</span>.
              </p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 px-12 py-4 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-3xl border border-primary/30 backdrop-blur-sm">
                <Link to="/auth" className="flex items-center justify-center group">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 ml-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-background/80 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 px-12 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl">
                <Link to="/auth">Member Access</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-editorial-sage to-editorial-blush border-2 border-background shadow-sm"></div>
                  ))}
                </div>
                <span className="font-medium">1,000+ members</span>
              </div>
              <div className="hidden sm:flex items-center">
                <div className="flex mr-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <span className="font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 px-fluid-4 py-fluid-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-fluid-3xl font-light text-foreground mb-6 tracking-tight">
                What Makes Us Different
              </h2>
              <p className="text-fluid-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
            <div className="glass-card p-12 lg:p-16 rounded-3xl border border-primary/10 shadow-xl backdrop-blur-sm">
              <div className="mb-10">
                <h2 className="font-display text-fluid-3xl font-light text-foreground mb-6 tracking-tight">
                  Ready to Transform Your Wellness Journey?
                </h2>
                <p className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Join our vibrant community of women who support, inspire, and grow together every day.
                </p>
              </div>
              
              <div className="space-y-6">
                <Button asChild size="lg" className="glass-card bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-xl rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] shadow-xl border border-primary/20">
                  <Link to="/auth" className="flex items-center justify-center group">
                    Start Your Journey Today
                    <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <p className="text-sm text-muted-foreground tracking-wide">
                  Join 1,000+ women • Exclusive membership • Transform together
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-fluid-4 py-12 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground tracking-wide">
            © 2024 HUMBL Girls Club. Creating safe spaces for women to thrive.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;