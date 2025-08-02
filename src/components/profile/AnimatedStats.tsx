import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useViewport } from '@/hooks/use-mobile';

interface AnimatedStatsProps {
  totalPoints: number;
  availablePoints: number;
  completedChallenges: number;
}

const AnimatedStatCard = React.memo<{
  icon: React.ElementType;
  title: string;
  value: number;
  iconColor: string;
  iconBgColor: string;
  delay?: number;
}>(({ icon: Icon, title, value, iconColor, iconBgColor, delay = 0 }) => {
  const animatedValue = useCountUp(value, 2000 + delay);
  const { isMobile } = useViewport();
  
  return (
    <Card className="card-glass border-0 shadow-stats group overflow-hidden">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div 
            className={`p-3 lg:p-4 rounded-full ${iconBgColor} transform group-hover:scale-110 transition-all duration-500 shadow-sm flex-shrink-0`}
            style={{ willChange: 'transform' }}
            role="img"
            aria-label={`${title} icon`}
          >
            <Icon className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} ${iconColor}`} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground font-semibold mb-1`}>
              {title}
            </p>
            <p 
              className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent`}
              aria-label={`${title}: ${value}`}
              style={{ willChange: 'contents' }}
            >
              {animatedValue.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
      </CardContent>
    </Card>
  );
});

AnimatedStatCard.displayName = 'AnimatedStatCard';

export const AnimatedStats: React.FC<AnimatedStatsProps> = React.memo(({
  totalPoints,
  availablePoints,
  completedChallenges
}) => {
  const { isMobile } = useViewport();
  
  return (
    <div 
      className={`grid gap-4 lg:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}
      role="region"
      aria-label="User statistics"
    >
      <AnimatedStatCard
        icon={Star}
        title="Total Points"
        value={totalPoints}
        iconColor="text-primary"
        iconBgColor="bg-primary/10"
        delay={0}
      />
      <AnimatedStatCard
        icon={Star}
        title="Available Points"
        value={availablePoints}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-500/10"
        delay={200}
      />
      <AnimatedStatCard
        icon={Trophy}
        title="Challenges Won"
        value={completedChallenges}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-500/10"
        delay={400}
      />
    </div>
  );
});

AnimatedStats.displayName = 'AnimatedStats';