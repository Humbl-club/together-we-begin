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

          <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />
          </div>

          <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Password must be at least 6 characters long</span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 transition-all text-base font-medium group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Update Password
              </>
            )}
          </Button>
          </form>
        </div>
      </div>
    </div>
  );
};