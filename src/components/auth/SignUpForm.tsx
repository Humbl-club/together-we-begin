
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, AtSign, Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SignUpFormProps {
  inviteCode: string;
  onSuccess: () => void;
  onBackToInvite: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ 
  inviteCode, 
  onSuccess, 
  onBackToInvite 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          username: formData.username,
          invite_code: inviteCode
        }
      );

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Mark invite as used - only if sign up was successful
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString(),
          used_by: null // Will be set by trigger after user profile is created
        })
        .eq('code', inviteCode);

      if (inviteError) {
        console.error('Error updating invite:', inviteError);
        // Don't fail the signup for this, just log it
      }

      toast({
        title: "Welcome to HUMBL!",
        description: "Your account has been created successfully.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Sign up error:', error);
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Futuristic Background Effects */}
      <div className="relative">
        {/* Complex animated background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-gradient-conic from-primary/50 via-accent/40 to-secondary/50 rounded-full blur-3xl animate-spin" style={{ animationDuration: '25s' }} />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-gradient-radial from-accent/40 via-primary/30 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-secondary/40 to-accent/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-tl from-primary/30 to-secondary/40 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Next-gen glass container */}
        <div className="relative backdrop-blur-3xl bg-gradient-to-br from-background/95 via-background/85 to-card/95 border border-white/25 rounded-3xl p-12 shadow-2xl shadow-primary/15">
          {/* Dynamic particle system */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-primary/60 to-accent/60 rounded-full animate-ping"
                style={{
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>

          <div className="text-center mb-12">
            {/* Next-level icon design */}
            <div className="relative mb-12">
              {/* Triple rotating rings */}
              <div className="absolute inset-0 w-36 h-36 mx-auto">
                <div className="w-full h-full border-2 border-dotted border-primary/20 rounded-full animate-spin" style={{ animationDuration: '15s' }} />
              </div>
              <div className="absolute inset-3 w-30 h-30 mx-auto">
                <div className="w-full h-full border border-accent/30 rounded-full animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
              </div>
              <div className="absolute inset-6 w-24 h-24 mx-auto">
                <div className="w-full h-full border border-primary/40 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
              </div>
              
              {/* Multi-layer glow */}
              <div className="absolute inset-0 w-36 h-36 mx-auto">
                <div className="w-full h-full bg-gradient-conic from-primary/40 via-accent/30 via-secondary/30 to-primary/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              </div>
              
              {/* Central masterpiece */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-background/98 via-card/95 to-background/98 backdrop-blur-2xl border-2 border-white/40 shadow-2xl">
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/25 via-accent/25 to-primary/25">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                </div>
              </div>
            </div>

            {/* Epic typography */}
            <div className="space-y-8">
              <div className="space-y-3">
                <h1 className="text-6xl font-black bg-gradient-to-r from-primary via-accent via-secondary to-primary bg-clip-text text-transparent leading-none">
                  Create Your
                </h1>
                <h1 className="text-6xl font-black bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  Account
                </h1>
              </div>
              
              {/* Elaborate divider */}
              <div className="flex items-center justify-center space-x-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60" />
                <div className="w-3 h-3 bg-primary/70 rounded-full animate-pulse" />
                <div className="h-px w-6 bg-gradient-to-r from-primary/60 to-accent/60" />
                <div className="w-2 h-2 bg-accent/60 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="h-px w-20 bg-gradient-to-r from-accent/60 via-secondary/60 to-primary/60" />
                <div className="w-2 h-2 bg-secondary/60 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                <div className="h-px w-6 bg-gradient-to-r from-secondary/60 to-accent/60" />
                <div className="w-3 h-3 bg-accent/70 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/60" />
              </div>
              
              <p className="text-muted-foreground font-light text-xl leading-relaxed max-w-lg mx-auto">
                Join our inspiring and empowering community of extraordinary women
              </p>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-8">
            {/* Premium form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="group space-y-3">
                <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 group-focus-within:from-primary/25 group-focus-within:to-accent/25 transition-all shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 text-base bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/98 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>

              {/* Username */}
              <div className="group space-y-3">
                <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 group-focus-within:from-primary/25 group-focus-within:to-accent/25 transition-all shadow-sm">
                    <AtSign className="w-4 h-4" />
                  </div>
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 text-base bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/98 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                    placeholder="Choose username"
                    autoComplete="username"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>

              {/* Email - Full width */}
              <div className="group space-y-3 md:col-span-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 group-focus-within:from-primary/25 group-focus-within:to-accent/25 transition-all shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 text-base bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/98 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                    placeholder="your.email@example.com"
                    autoComplete="email"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>

              {/* Password */}
              <div className="group space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 group-focus-within:from-primary/25 group-focus-within:to-accent/25 transition-all shadow-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 text-base bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/98 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                    placeholder="Create secure password"
                    autoComplete="new-password"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="group space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 group-focus-within:from-primary/25 group-focus-within:to-accent/25 transition-all shadow-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 text-base bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-sm border-2 border-border/50 focus:border-primary/70 focus:bg-background/98 rounded-xl pl-6 pr-6 shadow-sm transition-all duration-300 group-focus-within:shadow-lg"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>
            </div>

            {/* Epic action buttons */}
            <div className="flex flex-col md:flex-row gap-6 pt-8">
              <Button 
                type="button"
                variant="outline"
                onClick={onBackToInvite}
                disabled={loading}
                className="flex-1 h-16 text-base font-medium border-2 border-border/60 hover:border-primary/60 bg-gradient-to-r from-background/80 to-card/80 backdrop-blur-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
              >
                <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                Back to Invite
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="relative flex-1 h-16 bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-primary-foreground font-bold text-base rounded-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] group overflow-hidden"
              >
                {/* Button aurora effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all" />
                
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    <span className="animate-pulse">Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <Sparkles className="w-6 h-6 ml-3 group-hover:rotate-12 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
