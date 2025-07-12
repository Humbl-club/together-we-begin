
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
      <div className="auth-container">
        <div className="floating-card max-w-md mx-auto text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="auth-container">
      {renderCurrentStep()}
    </div>
  );
};

export default Auth;
