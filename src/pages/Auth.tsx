import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { InviteCodeForm } from '@/components/auth/InviteCodeForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { SignInForm } from '@/components/auth/SignInForm';

type AuthStep = 'signin' | 'invite' | 'signup';

const Auth: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('signin');
  const [inviteCode, setInviteCode] = useState('');
  const { user, loading } = useAuth();

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