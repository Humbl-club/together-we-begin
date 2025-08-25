import React, { useState, Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { MobileContainer } from '@/components/ui/mobile-container';
import { MobileEnhancedSkeleton } from '@/components/ui/mobile-enhanced-skeleton';
import { MobileErrorBoundary } from '@/components/ui/mobile-error-boundary';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarProvider } from '@/components/ui/sidebar';

// Lazy load admin components for better performance
const AnalyticsDashboard = React.lazy(() => import('@/components/admin/AnalyticsDashboard'));
const UserManagement = React.lazy(() => import('@/components/admin/UserManagement'));
const ContentModeration = React.lazy(() => import('@/components/admin/ContentModeration'));
const EventManagement = React.lazy(() => import('@/components/admin/EventManagement'));
const ChallengeManagement = React.lazy(() => import('@/components/admin/ChallengeManagement'));
const NotificationManagement = React.lazy(() => import('@/components/admin/NotificationManagement'));
const SystemConfiguration = React.lazy(() => import('@/components/admin/SystemConfiguration'));
const AdminPerformanceMonitor = React.lazy(() => import('@/components/admin/AdminPerformanceMonitor'));

export const AdminMobilePage: React.FC = () => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'users':
        return <UserManagement />;
      case 'moderation':
        return <ContentModeration />;
      case 'events':
        return <EventManagement />;
      case 'challenges':
        return <ChallengeManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <SystemConfiguration />;
      default:
        return <AdminPerformanceMonitor />;
    }
  };

  if (isMobile) {
    return (
      <MobileErrorBoundary>
        <MobileContainer className="min-h-screen">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">Admin Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SidebarProvider>
                  <AdminSidebar
                    activeSection={activeSection}
                    onSectionChange={(section) => {
                      setActiveSection(section);
                      setSidebarOpen(false);
                    }}
                  />
                </SidebarProvider>
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile Content */}
          <div className="p-4">
            <Suspense fallback={<MobileEnhancedSkeleton variant="mobile-feed" />}>
              <MobileErrorBoundary>
                {renderContent()}
              </MobileErrorBoundary>
            </Suspense>
          </div>
        </MobileContainer>
      </MobileErrorBoundary>
    );
  }

  // Desktop Layout
  return (
    <MobileErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AdminSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 p-6 overflow-auto">
            <Suspense fallback={<MobileEnhancedSkeleton variant="mobile-feed" />}>
              <MobileErrorBoundary>
                {renderContent()}
              </MobileErrorBoundary>
            </Suspense>
          </main>
        </div>
      </SidebarProvider>
    </MobileErrorBoundary>
  );
};

export default AdminMobilePage;