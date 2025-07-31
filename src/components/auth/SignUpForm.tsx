
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
    <div className="w-full max-w-md mx-auto">
      <div className="editorial-card p-8">
        {/* Floating gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
        </div>

        <div className="text-center mb-8">
          {/* Icon with gradient background */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl" />
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
              <Sparkles className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-3xl editorial-heading mb-4 text-foreground">
            Create Your Account
          </h1>
          <p className="text-muted-foreground font-light text-lg">
            Join our empowering community of women
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
                placeholder="Choose a unique username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
                placeholder="Create a secure password"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base bg-background/50 border-2 focus:border-primary/50"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              type="button"
              variant="outline"
              onClick={onBackToInvite}
              disabled={loading}
              className="flex-1 h-12 text-base border-2 hover:border-primary/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-base font-medium group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Account
                  <Sparkles className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
