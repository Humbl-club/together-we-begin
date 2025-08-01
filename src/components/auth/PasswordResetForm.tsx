import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PasswordResetForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have the required tokens for password reset
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Set the session with the tokens from the URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }, [searchParams, navigate, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      // Redirect to dashboard after successful password reset
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Cybersecurity-themed Background */}
      <div className="relative">
        {/* Security-focused animated elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-gradient-conic from-primary/40 via-accent/30 to-secondary/40 rounded-full blur-3xl animate-spin" style={{ animationDuration: '18s' }} />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-radial from-accent/40 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3.5s' }} />
        </div>
        
        {/* Secure glass container */}
        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-background/92 via-background/88 to-card/92 border border-white/30 rounded-3xl p-10 shadow-2xl shadow-primary/12">
          {/* Security indicators */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-green-500/70 rounded-full animate-ping"
                style={{
                  top: `${15 + Math.random() * 70}%`,
                  left: `${15 + Math.random() * 70}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2.5s'
                }}
              />
            ))}
          </div>

          <div className="text-center mb-10">
            {/* Security-focused icon design */}
            <div className="relative mb-8">
              {/* Protective shield rings */}
              <div className="absolute inset-0 w-32 h-32 mx-auto">
                <div className="w-full h-full border-2 border-dashed border-green-400/30 rounded-full animate-spin" style={{ animationDuration: '14s' }} />
              </div>
              <div className="absolute inset-2 w-28 h-28 mx-auto">
                <div className="w-full h-full border border-primary/40 rounded-full animate-pulse" style={{ animationDuration: '2.2s' }} />
              </div>
              
              {/* Security glow */}
              <div className="absolute inset-0 w-32 h-32 mx-auto">
                <div className="w-full h-full bg-gradient-conic from-green-400/30 via-primary/30 to-green-400/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3.5s' }} />
              </div>
              
              {/* Shield icon container */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-background/96 via-card/92 to-background/96 backdrop-blur-xl border-2 border-white/40 shadow-2xl">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 via-primary/20 to-green-400/20">
                  <Shield className="w-10 h-10 text-primary animate-pulse" style={{ animationDuration: '1.8s' }} />
                </div>
              </div>
            </div>

            {/* Security-focused typography */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-green-400 to-primary bg-clip-text text-transparent leading-tight">
                  Reset Your Password
                </h1>
              </div>
              
              {/* Security divider */}
              <div className="flex items-center justify-center space-x-2">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-green-400/50" />
                <div className="w-2 h-2 bg-green-400/60 rounded-full animate-pulse" />
                <div className="h-px w-16 bg-gradient-to-r from-green-400/50 via-primary/50 to-green-400/50" />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-green-400/50" />
              </div>
              
              <p className="text-muted-foreground font-light text-lg leading-relaxed max-w-md mx-auto">
                Create a new secure password to protect your account
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-8">
            {/* Biometric Password Input */}
            <div className="group space-y-4 auth-form-field">
              <Label htmlFor="password" className="text-base font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400/20 via-primary/20 to-green-400/20 group-focus-within:from-green-400/30 group-focus-within:to-primary/30 transition-all shadow-lg auth-security-scan">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-lg">New Secure Password</span>
              </Label>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-primary/20 to-green-400/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="auth-magnetic h-16 text-lg bg-gradient-to-br from-background/98 via-card/98 to-background/98 backdrop-blur-2xl border-2 border-border/50 focus:border-green-400/70 rounded-2xl px-6 shadow-lg transition-all duration-300 focus:shadow-xl focus:shadow-green-400/20"
                  placeholder="Enter your new secure password"
                  autoComplete="new-password"
                />
                
                {/* Biometric strength indicator */}
                <div className="absolute bottom-3 left-6 right-6">
                  <div className="h-1 bg-background/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full auth-biometric rounded-full"
                      style={{ 
                        width: `${Math.min((password.length / 8) * 100, 100)}%`,
                        background: password.length < 4 ? 'hsl(0, 70%, 50%)' : 
                                   password.length < 6 ? 'hsl(30, 70%, 50%)' : 
                                   password.length < 8 ? 'hsl(60, 70%, 50%)' : 'hsl(120, 70%, 50%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Biometric Confirmation Input */}
            <div className="group space-y-4 auth-form-field">
              <Label htmlFor="confirmPassword" className="text-base font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400/20 via-primary/20 to-green-400/20 group-focus-within:from-green-400/30 group-focus-within:to-primary/30 transition-all shadow-lg auth-security-scan">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-lg">Confirm Secure Password</span>
              </Label>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-primary/20 to-green-400/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="auth-magnetic h-16 text-lg bg-gradient-to-br from-background/98 via-card/98 to-background/98 backdrop-blur-2xl border-2 border-border/50 focus:border-green-400/70 rounded-2xl px-6 shadow-lg transition-all duration-300 focus:shadow-xl focus:shadow-green-400/20"
                  placeholder="Confirm your secure password"
                  autoComplete="new-password"
                />
                
                {/* Match indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {confirmPassword && (
                    <div className={`w-3 h-3 rounded-full auth-trust ${
                      password === confirmPassword ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                  )}
                </div>
              </div>
            </div>

            {/* Security Requirements Panel */}
            <div className="backdrop-blur-lg bg-gradient-to-br from-green-400/10 via-primary/10 to-green-400/10 border border-green-400/30 rounded-2xl p-6 auth-gesture-responsive">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Shield className="w-5 h-5 text-green-400 auth-trust" />
                  <span className="text-foreground/90">Security Requirements</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-400' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-400' : 'bg-muted-foreground/40'}`} />
                    <span>Minimum 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${password === confirmPassword && password ? 'text-green-400' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${password === confirmPassword && password ? 'bg-green-400' : 'bg-muted-foreground/40'}`} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Biometric-Style Update Button */}
            <Button 
              type="submit" 
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="auth-magnetic w-full h-18 bg-gradient-to-r from-green-400 via-primary to-green-400 hover:from-green-400/90 hover:via-primary/90 hover:to-green-400/90 text-primary-foreground font-bold text-lg rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-green-400/30 group overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  <span className="text-lg tracking-wide">Securing Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-lg tracking-wide">Update Security</span>
                  <Shield className="w-6 h-6 ml-3 group-hover:rotate-12 transition-transform duration-300" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};