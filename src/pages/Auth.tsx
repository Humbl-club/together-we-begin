import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { InviteCodeForm } from '@/components/auth/InviteCodeForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { SignInForm } from '@/components/auth/SignInForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

type AuthStep = 'signin' | 'invite' | 'signup' | 'reset';

const Auth: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('signin');
  const [inviteCode, setInviteCode] = useState('');
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if we're in password reset mode
    const mode = searchParams.get('mode');
    const accessToken = searchParams.get('access_token');
    
    if (mode === 'reset' && accessToken) {
      setCurrentStep('reset');
    }
  }, [searchParams]);

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-hero">
        <div className="editorial-card max-w-md mx-auto text-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground font-light">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  const handleValidInviteCode = (code: string) => {
    setInviteCode(code);
    setCurrentStep('signup');
  };

  const handleSignUpSuccess = () => {
    // User will be automatically redirected by the auth state change
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'invite':
        return <InviteCodeForm onValidCode={handleValidInviteCode} />;
      
      case 'signup':
        return (
          <SignUpForm
            inviteCode={inviteCode}
            onSuccess={handleSignUpSuccess}
            onBackToInvite={() => setCurrentStep('invite')}
          />
        );
      
      case 'reset':
        return <PasswordResetForm />;
      
      default:
        return (
          <SignInForm onSwitchToSignUp={() => setCurrentStep('invite')} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-editorial-hero flex items-center justify-center p-4">
      {renderCurrentStep()}
    </div>
  );
};

export default Auth;