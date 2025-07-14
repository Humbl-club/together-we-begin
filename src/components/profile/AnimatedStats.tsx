import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedStatsProps {
  totalPoints: number;
  availablePoints: number;
  completedChallenges: number;
}

const AnimatedStatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: number;
  iconColor: string;
  iconBgColor: string;
  delay?: number;
}> = ({ icon: Icon, title, value, iconColor, iconBgColor, delay = 0 }) => {
  const animatedValue = useCountUp(value, 2000 + delay);
  
  return (
    <Card className="stats-card group">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${iconBgColor} transform group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold">{animatedValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AnimatedStats: React.FC<AnimatedStatsProps> = ({
  totalPoints,
  availablePoints,
  completedChallenges
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedStatCard
        icon={Star}
        title="Total Points"
        value={totalPoints}
        iconColor="text-amber-600"
        iconBgColor="bg-amber-100"
        delay={0}
      />
      <AnimatedStatCard
        icon={Star}
        title="Available Points"
        value={availablePoints}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
        delay={200}
      />
      <AnimatedStatCard
        icon={Trophy}
        title="Challenges Won"
        value={completedChallenges}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
        delay={400}
      />
    </div>
  );
};