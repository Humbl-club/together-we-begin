
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
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
    <div className="floating-card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Create Your Account
        </h1>
        <p className="text-muted-foreground">
          Join the HUMBL community
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline"
            onClick={onBackToInvite}
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
