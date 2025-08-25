import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Calendar, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { IOSScrollView } from '@/components/ui/ios-native';
import { SafeAreaLayout } from '@/components/ui/safe-area-layout';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user, loading, connectionError } = useAuth();
  const { isMobile, orientation, safeAreaInsets } = useMobileFirst();
  const haptic = useHapticFeedback();
  const { connectionStatus, retryConnection } = useConnectionStatus();

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <SafeAreaLayout edges={['top', 'bottom']} className="min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto"></div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Loading Humbl Girls Club...</p>
              {connectionError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                  <AlertCircle className="w-4 h-4 text-destructive mx-auto mb-2" />
                  <p className="text-xs text-destructive mb-2">{connectionError}</p>
                  <MobileNativeButton
                    size="sm"
                    variant="ghost"
                    onClick={() => retryConnection()}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </MobileNativeButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </SafeAreaLayout>
    );
  }

  return (
    <SafeAreaLayout edges={['top', 'bottom']} className="min-h-screen">
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <ConnectionStatus showText={connectionStatus !== 'connected'} />
      </div>
      
      <IOSScrollView className="min-h-screen">
        {/* iOS Native Background */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
          
          {/* iOS-style subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.03]"></div>
          
          {/* Main Content */}
          <div className={cn(
            "flex items-center justify-center px-4",
            "min-h-screen",
            isMobile ? "py-8" : "py-16"
          )}>
            <div className="w-full max-w-sm text-center">
              
              {/* iOS Native Glass Card */}
              <div className={cn(
                // iOS-style card with proper blur and transparency
                "backdrop-blur-xl bg-white/80 dark:bg-slate-800/80",
                "border border-white/20 dark:border-slate-700/30",
                "shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]",
                "dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
                "transition-all duration-300",
                // iOS rounded corners
                isMobile ? "rounded-[24px] p-8 mx-2" : "rounded-[32px] p-10",
                orientation === 'landscape' && isMobile ? "py-6" : ""
              )}>
                
                {/* Logo with iOS typography */}
                <div className={cn("mb-8", isMobile && "mb-6")}>
                  <h1 className={cn(
                    // iOS system font weights and spacing
                    "font-display font-bold tracking-tight mb-4",
                    "text-slate-900 dark:text-white",
                    isMobile 
                      ? "text-[34px] leading-[41px]" // iOS Large Title size
                      : "text-[40px] leading-[48px]"
                  )}>
                    <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Humbl
                    </span>
                    <span className="block font-light italic text-primary/90 text-[20px] leading-[24px] -mt-1">
                      Girls Club
                    </span>
                  </h1>
                  <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
                </div>

                {/* Description with iOS text styles */}
                <p className={cn(
                  "text-slate-600 dark:text-slate-300",
                  "font-medium leading-relaxed mb-8",
                  isMobile ? "text-[16px] leading-[20px] px-2" : "text-[18px] leading-[22px]"
                )}>
                  A private community for women to connect, join exclusive events, and take on wellness challenges together.
                </p>

                {/* Features with iOS SF Symbols style */}
                <div className={cn(
                  "grid grid-cols-3 gap-4 mb-8",
                  isMobile ? "gap-3 mb-6" : "gap-6 mb-8"
                )}>
                  <div className="space-y-2">
                    <div className={cn(
                      "bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                      "shadow-sm",
                      isMobile ? "w-11 h-11" : "w-12 h-12"
                    )}>
                      <Heart className={cn(
                        "text-primary",
                        isMobile ? "w-[18px] h-[18px]" : "w-5 h-5"
                      )} />
                    </div>
                    <p className={cn(
                      "text-slate-500 dark:text-slate-400 font-medium",
                      isMobile ? "text-[11px]" : "text-xs"
                    )}>
                      Community
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className={cn(
                      "bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                      "shadow-sm",
                      isMobile ? "w-11 h-11" : "w-12 h-12"
                    )}>
                      <Calendar className={cn(
                        "text-primary",
                        isMobile ? "w-[18px] h-[18px]" : "w-5 h-5"
                      )} />
                    </div>
                    <p className={cn(
                      "text-slate-500 dark:text-slate-400 font-medium",
                      isMobile ? "text-[11px]" : "text-xs"
                    )}>
                      Events
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className={cn(
                      "bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto",
                      "shadow-sm",
                      isMobile ? "w-11 h-11" : "w-12 h-12"
                    )}>
                      <Trophy className={cn(
                        "text-primary",
                        isMobile ? "w-[18px] h-[18px]" : "w-5 h-5"
                      )} />
                    </div>
                    <p className={cn(
                      "text-slate-500 dark:text-slate-400 font-medium",
                      isMobile ? "text-[11px]" : "text-xs"
                    )}>
                      Challenges
                    </p>
                  </div>
                </div>

                {/* iOS Native CTAs */}
                <div className="space-y-3">
                  <Link to="/auth?step=invite">
                    <MobileNativeButton 
                      variant="primary"
                      fullWidth={true}
                      haptic={true}
                      size={isMobile ? "md" : "lg"}
                      className={cn(
                        "bg-primary hover:bg-primary/90 text-white font-semibold",
                        "shadow-lg shadow-primary/25",
                        isMobile ? "h-[50px] text-[17px]" : "h-[56px] text-[18px]"
                      )}
                      onClick={() => haptic.impact('medium')}
                    >
                      Join with Invitation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </MobileNativeButton>
                  </Link>
                  
                  <Link to="/auth">
                    <MobileNativeButton 
                      variant="ghost" 
                      fullWidth={true}
                      haptic={true}
                      size={isMobile ? "sm" : "md"}
                      className={cn(
                        "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50",
                        isMobile ? "h-[44px] text-[15px]" : "h-[48px] text-[16px]"
                      )}
                      onClick={() => haptic.selection()}
                    >
                      I'm already a member
                    </MobileNativeButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </IOSScrollView>
    </SafeAreaLayout>
  );
};

export default Index;