import React, { memo } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { EnhancedErrorBoundary } from '@/hooks/useEnhancedErrorBoundary';
import { SEO } from '@/components/seo/SEO';
import MobileSuperAdminDashboard from './MobileSuperAdminDashboard';
import DesktopSuperAdminDashboard from './DesktopSuperAdminDashboard';
import { MobileLoading } from '@/components/ui/mobile-loading';

export const SuperAdminDashboard: React.FC = memo(() => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const { isMobile, isTablet, isDesktop } = useMobileOptimization();
  const { loading: statsLoading } = usePlatformStats();

  // Check authorization
  if (authLoading || statsLoading) {
    return <MobileLoading variant="skeleton" size="lg" text="Loading super admin dashboard..." />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Use adaptive rendering based on device
  if (isMobile) {
    return (
      <div className="mobile-app-container">
        <SEO 
          title="Super Admin Dashboard" 
          description="Platform-wide management and oversight for Humbl Girls Club." 
          canonical="/super-admin" 
        />
        <h1 className="sr-only">Super Admin Dashboard</h1>
        <MobileSuperAdminDashboard />
      </div>
    );
  }

  // Desktop and tablet view
  return (
    <div className="desktop-layout min-h-screen bg-background">
      <EnhancedErrorBoundary
        showErrorDetails={process.env.NODE_ENV === 'development'}
        allowRetry={true}
      >
        <SEO 
          title="Super Admin Dashboard" 
          description="Platform-wide management and oversight for Humbl Girls Club." 
          canonical="/super-admin" 
        />
        <h1 className="sr-only">Super Admin Dashboard</h1>
        <DesktopSuperAdminDashboard />
      </EnhancedErrorBoundary>
    </div>
  );
});

export default SuperAdminDashboard;