
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
    // Check URL parameters for initial step
    const step = searchParams.get('step');
    const mode = searchParams.get('mode');
    const accessToken = searchParams.get('access_token');
    
    if (step === 'invite') {
      setCurrentStep('invite');
    } else if (mode === 'reset' && accessToken) {
      setCurrentStep('reset');
    }
  }, [searchParams]);

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
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
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 sm:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md overflow-y-auto py-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default Auth;
