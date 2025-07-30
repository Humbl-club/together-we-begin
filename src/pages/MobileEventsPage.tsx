import React, { memo, Suspense } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/components/auth/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MobileEnhancedSkeleton, MobileHeaderSkeleton } from '@/components/ui/mobile-enhanced-skeleton';
import { MobileErrorBoundary } from '@/components/ui/mobile-error-boundary';
import { MobileOfflineIndicator } from '@/components/ui/mobile-offline-indicator';

// Import mobile-optimized components for events page
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, Search, Filter, Plus } from 'lucide-react';

const MobileEventsPage: React.FC = memo(() => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.id);

  if (!isMobile) {
    // Return regular events page for desktop
    return (
      <UnifiedLayout profile={profile}>
        <div className="container mx-auto px-8 py-12">
          <h1 className="text-3xl font-bold mb-8">Events</h1>
          {/* Desktop events content */}
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <MobileErrorBoundary>
      <MobileOfflineIndicator />
      <UnifiedLayout profile={profile}>
        <div 
          className="space-y-4"
          style={{
            paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
            paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
            paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
            paddingRight: `max(16px, ${safeAreaInsets.right}px)`
          }}
        >
        {/* Mobile Header */}
        <Suspense fallback={<MobileHeaderSkeleton />}>
          <header className="flex items-center justify-between py-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Events</h1>
              <p className="text-sm text-muted-foreground">Discover amazing gatherings</p>
            </div>
            
            <div className="flex items-center gap-2">
              <MobileNativeButton variant="ghost" size="sm">
                <Search className="h-5 w-5" />
              </MobileNativeButton>
              <MobileNativeButton variant="ghost" size="sm">
                <Filter className="h-5 w-5" />
              </MobileNativeButton>
            </div>
          </header>
        </Suspense>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Wellness', 'Social', 'Learning', 'Networking'].map((filter) => (
            <Badge 
              key={filter}
              variant={filter === 'All' ? 'default' : 'secondary'}
              className="whitespace-nowrap px-4 py-2 touch-target"
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Featured Event */}
        <MobileFirstCard variant="premium" padding="md">
          <MobileFirstCardContent>
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary">Featured</Badge>
              <h3 className="text-lg font-semibold">Morning Mindfulness & Coffee</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Today • 9:00 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Central Park</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>12 going • 3 spots left</span>
                </div>
              </div>
              <MobileNativeButton variant="primary" fullWidth size="lg">
                Join Event
              </MobileNativeButton>
            </div>
          </MobileFirstCardContent>
        </MobileFirstCard>

        {/* Create Event CTA */}
        <MobileNativeButton 
          variant="secondary" 
          fullWidth 
          size="lg"
          className="border-dashed border-2 text-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Your Own Event
        </MobileNativeButton>

        {/* Events List */}
        <Suspense fallback={<MobileEnhancedSkeleton variant="mobile-list" />}>
          <div className="space-y-4">
            {/* More events would be loaded here */}
          </div>
        </Suspense>
        </div>
      </UnifiedLayout>
    </MobileErrorBoundary>
  );
});

export default MobileEventsPage;