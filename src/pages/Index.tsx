import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatedLogo } from '@/components/ui/animated-logo';

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
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Creative Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/2 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-gradient-to-tr from-accent/3 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-px h-96 bg-primary/10 rotate-12"></div>
        <div className="absolute bottom-1/4 right-1/3 w-px h-64 bg-accent/10 -rotate-12"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 w-full py-8 px-6 lg:py-12 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AnimatedLogo size="sm" />
            <div className="font-display text-lg md:text-xl font-extralight text-foreground tracking-[0.3em] uppercase">
              HUMBL
            </div>
          </div>
          <div className="text-xs text-muted-foreground/40 tracking-[0.2em] uppercase font-light">
            Est. 2024
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="relative z-10 px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 lg:col-start-2">
                <div className="space-y-16">
                  {/* Magazine Style Label */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-px bg-foreground"></div>
                    <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-light">
                      Exclusive Access
                    </span>
                  </div>
                  
                  {/* Main Headline */}
                  <div className="space-y-8">
                    <h1 className="font-display font-extralight leading-[0.75] tracking-[-0.02em]">
                      <span className="block text-7xl md:text-8xl lg:text-9xl text-foreground">GIRLS</span>
                      <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground/60 italic ml-8 md:ml-16">Club</span>
                    </h1>
                    
                    <div className="max-w-md space-y-6">
                      <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
                        An exclusive sanctuary for women who have arrived. 
                        Where growth meets grace, and connections become legacy.
                      </p>
                    </div>
                  </div>
                  
                  {/* CTA Section */}
                  <div className="space-y-8">
                    <div className="space-y-4 max-w-xs">
                      <Button asChild className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-none font-light text-sm tracking-[0.1em] uppercase transition-all duration-500 hover:tracking-[0.15em]">
                        <Link to="/auth?step=invite">
                          I have an invite code
                        </Link>
                      </Button>
                      
                      <div className="relative">
                        <Button asChild variant="ghost" className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none font-light text-sm transition-all duration-500 group">
                          <Link to="/auth">
                            <span className="relative">
                              Sign in
                              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-500 group-hover:w-full"></span>
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Content - Creative Typography */}
              <div className="lg:col-span-4 lg:col-start-10 hidden lg:block">
                <div className="space-y-12 text-right">
                  <div className="space-y-6 flex flex-col items-end">
                    <AnimatedLogo size="xl" />
                    <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground/40 font-light">
                      Artfully Crafted
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-px h-24 bg-foreground/10 ml-auto"></div>
                    <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground/40 font-light">
                      Membership<br/>
                      By invitation<br/>
                      Only
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-fluid-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-muted-foreground/60 tracking-widest uppercase font-light">
            HUMBL Girls Club — Est. 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;