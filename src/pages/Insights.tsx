import React, { memo, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { SEO } from '@/components/seo/SEO';

const Insights: React.FC = memo(() => {
  const { user } = useAuth();
  const { stats, loading } = useDashboardData(user?.id);

  return (
    <main className="min-h-screen bg-background">
      <SEO title="Insights" description="Your personal activity insights and stats." canonical="/insights" />
      <h1 className="sr-only">Insights</h1>

      <section className="p-4 md:p-6">
        <header className="mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Your Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">A focused view of your messages, steps, posts, and upcoming events.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-24 md:h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">{[1,2,3,4].map((i)=> (<div key={i} className="h-24 md:h-28 bg-muted rounded-xl animate-pulse" />))}</div>}>
            <StatsGrid stats={stats} />
          </Suspense>
        )}
      </section>
    </main>
  );
});

export default Insights;
