import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { Link } from 'react-router-dom';

const MobileFirstIndex = memo(() => {
  const { user, loading } = useAuth();
  const { isMobile, safeAreaInsets } = useMobileFirst();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        style={{
          paddingTop: `max(20px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(20px, ${safeAreaInsets.bottom}px)`
        }}
      >
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-light">
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile-first landing experience
    return (
      <div 
        className="min-h-screen bg-background flex flex-col"
        style={{
          paddingTop: `max(20px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(20px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(16px, ${safeAreaInsets.right}px)`
        }}
      >
        {/* Mobile Header */}
        <header className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AnimatedLogo size="sm" />
              <div className="font-display text-lg font-light text-foreground tracking-wider">
                HUMBL
              </div>
            </div>
            <div className="text-xs text-muted-foreground/60 tracking-widest">
              Est. 2024
            </div>
          </div>
        </header>

        {/* Mobile Hero Content */}
        <main className="flex-1 flex flex-col justify-center px-4 pb-20">
          <div className="space-y-8 text-center">
            {/* Mobile Logo */}
            <div className="space-y-4">
              <AnimatedLogo size="lg" />
              <div className="space-y-2">
                <h1 className="text-4xl font-light leading-tight tracking-tight">
                  <span className="block text-foreground">GIRLS</span>
                  <span className="block text-foreground/70 italic text-3xl">Club</span>
                </h1>
              </div>
            </div>

            {/* Mobile Description */}
            <div className="space-y-4 max-w-sm mx-auto">
              <p className="text-muted-foreground leading-relaxed">
                An exclusive sanctuary for women who have arrived. 
                Where growth meets grace.
              </p>
            </div>

            {/* Mobile CTA Buttons */}
            <div className="space-y-4 max-w-xs mx-auto">
              <Link to="/auth?step=invite" className="block">
                <MobileNativeButton 
                  variant="primary" 
                  fullWidth 
                  size="lg"
                  className="h-14 font-light tracking-wide"
                >
                  I have an invite code
                </MobileNativeButton>
              </Link>
              
              <Link to="/auth" className="block">
                <MobileNativeButton 
                  variant="ghost" 
                  fullWidth 
                  size="lg"
                  className="h-12 text-muted-foreground"
                >
                  Sign in
                </MobileNativeButton>
              </Link>
            </div>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/60 tracking-widest">
            HUMBL Girls Club — Est. 2024
          </p>
        </footer>
      </div>
    );
  }

  // Desktop experience (keep original)
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Creative Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/2 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-gradient-to-tr from-accent/3 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-px h-96 bg-primary/10 rotate-12"></div>
        <div className="absolute bottom-1/4 right-1/3 w-px h-64 bg-accent/10 -rotate-12"></div>
      </div>

      {/* Desktop Navigation Header */}
      <header className="relative z-50 w-full py-8 px-6 lg:py-12 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AnimatedLogo size="sm" />
            <div className="font-display text-lg md:text-xl font-extralight text-foreground tracking-[0.3em] uppercase">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                HUMBL
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/40 tracking-[0.2em] uppercase font-light">
            Est. 2024
          </div>
        </div>
      </header>

      {/* Desktop Hero Section */}
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
                       <span className="block text-7xl md:text-8xl lg:text-9xl text-foreground">
                         GIRLS
                       </span>
                       <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground/60 italic ml-8 md:ml-16">
                         Club
                       </span>
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
                       <Link to="/auth?step=invite" className="block">
                         <MobileNativeButton 
                           variant="primary" 
                           fullWidth 
                           size="lg" 
                           className="h-14 rounded-none font-light tracking-wide"
                         >
                           I have an invite code
                         </MobileNativeButton>
                       </Link>
                       
                       <div className="relative">
                         <Link to="/auth" className="block">
                           <MobileNativeButton 
                             variant="ghost" 
                             fullWidth 
                             size="lg" 
                             className="h-12 rounded-none font-light"
                           >
                             Sign in
                           </MobileNativeButton>
                         </Link>
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

       {/* Desktop Footer */}
       <footer className="relative z-10 px-6 py-16">
         <div className="max-w-4xl mx-auto text-center">
           <p className="text-xs text-muted-foreground/60 tracking-widest uppercase font-light">
             HUMBL Girls Club — Est. 2024
           </p>
         </div>
       </footer>
    </div>
  );
});

export default MobileFirstIndex;
