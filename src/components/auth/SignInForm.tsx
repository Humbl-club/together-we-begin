
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Mail, Lock, Heart, ArrowRight } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive"
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions.",
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Multi-layered Background Effects */}
      <div className="relative">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-3xl auth-float" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tr from-secondary/40 to-primary/20 rounded-full blur-2xl auth-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-accent/20 to-secondary/30 rounded-full blur-xl auth-float" style={{ animationDelay: '4s' }} />
        </div>
        
        {/* Glass morphism container */}
        <div className="relative backdrop-blur-xl bg-background/80 border border-border/20 rounded-3xl p-8 shadow-2xl">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute top-8 left-12 w-1 h-1 bg-primary/60 rounded-full animate-ping" />
            <div className="absolute top-16 right-16 w-1 h-1 bg-accent/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-12 left-8 w-1 h-1 bg-secondary/60 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </div>

          <div className="text-center mb-10">
            {/* Animated icon with multiple layers */}
            <div className="relative mb-8">
              {/* Rotating ring */}
              <div className="absolute inset-0 w-28 h-28 mx-auto">
                <div className="w-full h-full border-2 border-primary/20 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              
              {/* Pulsing glow */}
              <div className="absolute inset-0 w-28 h-28 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse" />
              </div>
              
              {/* Main icon container */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-background/90 to-card/90 backdrop-blur-sm border border-border/30 shadow-lg">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Animated text */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <p className="text-muted-foreground font-light text-lg max-w-sm mx-auto leading-relaxed">
                Continue your inspiring journey with the HUMBL community
              </p>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-8">
            {/* Email field with enhanced styling */}
            <div className="group space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-focus-within:from-primary/20 group-focus-within:to-accent/20 transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 text-base bg-gradient-to-br from-background/90 to-card/90 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/95 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                  placeholder="your.email@example.com"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
              </div>
            </div>

            {/* Password field with enhanced styling */}
            <div className="group space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-colors">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-focus-within:from-primary/20 group-focus-within:to-accent/20 transition-all">
                    <Lock className="w-4 h-4" />
                  </div>
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="text-sm text-primary hover:text-primary/80 transition-all font-medium hover:scale-105 active:scale-95"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!showForgotPassword}
                  disabled={loading || resetLoading}
                  className="h-14 text-base bg-gradient-to-br from-background/90 to-card/90 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/95 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                  placeholder="Enter your secure password"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
              </div>
            </div>

            {showForgotPassword && (
              <div className="relative backdrop-blur-lg bg-gradient-to-br from-muted/40 to-card/40 border border-border/40 p-8 rounded-2xl shadow-lg">
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Reset Your Password</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Enter your email address and we'll send you a secure link to reset your password.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading || !email}
                  variant="outline"
                  className="w-full h-14 border-2 hover:border-primary/70 bg-gradient-to-r from-background/80 to-card/80 backdrop-blur-sm font-medium text-base transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-3" />
                      Send Reset Email
                    </>
                  )}
                </Button>
              </div>
            )}

            {!showForgotPassword && (
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={loading || resetLoading}
                  className="relative w-full h-16 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] group overflow-hidden"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Signing you in...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                
                {/* Decorative divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-border/50 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-background px-4 text-xs text-muted-foreground font-medium">
                      Secure Authentication
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="mt-10 text-center">
            <div className="backdrop-blur-sm bg-muted/30 rounded-2xl p-6 border border-border/30">
              <p className="text-sm text-muted-foreground mb-4">
                New to our community?
              </p>
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <span>Join with invite code</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
