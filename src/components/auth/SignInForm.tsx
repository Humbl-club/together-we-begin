
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
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

  return (
    <div className={`editorial-card max-w-md mx-auto ${isMobile ? 'p-6' : 'p-8'}`}>
      <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} editorial-heading mb-3 text-foreground`}>
          Welcome Back
        </h1>
        <p className={`text-muted-foreground font-light ${isMobile ? 'text-sm' : ''}`}>
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <Label htmlFor="email" className={isMobile ? 'text-sm font-medium' : ''}>Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className={`mt-1 ${isMobile ? 'min-h-[48px] text-base' : ''}`}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="password" className={isMobile ? 'text-sm font-medium' : ''}>Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className={`mt-1 ${isMobile ? 'min-h-[48px] text-base' : ''}`}
            placeholder="Enter your password"
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className={`w-full bg-primary hover:bg-primary/90 transition-all ${isMobile ? 'min-h-[48px] text-base' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className={`${isMobile ? 'mt-4' : 'mt-6'} text-center`}>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className={`text-primary hover:text-primary/80 font-medium min-h-[44px] ${isMobile ? 'text-xs' : ''}`}
          >
            Sign up with invite code
          </button>
        </p>
      </div>
    </div>
  );
};
