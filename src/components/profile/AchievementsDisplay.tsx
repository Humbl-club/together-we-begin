import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Trophy, Calendar, Award } from 'lucide-react';
import { useStaggeredAnimation } from '@/hooks/useStaggeredAnimation';

interface CompletedChallenge {
  id: string;
  completion_date: string;
  challenges: {
    title: string;
    badge_name: string | null;
    points_reward: number | null;
  };
}

interface AchievementsDisplayProps {
  challenges: CompletedChallenge[];
}

export const AchievementsDisplay: React.FC<AchievementsDisplayProps> = ({ challenges }) => {
  const visibleChallenges = useStaggeredAnimation(challenges, 150);

  return (
    <Card className="profile-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Recent Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No challenges completed yet.</p>
            <p className="text-sm">Start participating to earn badges!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.slice(0, 5).map((challenge, index) => (
              <div
                key={challenge.id}
                className={`achievement-item flex items-center gap-4 p-4 rounded-lg border border-border/30 transition-all duration-500 ${
                  visibleChallenges[index] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  background: 'linear-gradient(135deg, hsl(var(--accent) / 0.3) 0%, hsl(var(--background) / 0.8) 100%)'
                }}
              >
                <div className="achievement-badge flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{challenge.challenges.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(challenge.completion_date), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {challenge.challenges.badge_name && (
                    <Badge variant="secondary" className="text-xs">
                      {challenge.challenges.badge_name}
                    </Badge>
                  )}
                  {challenge.challenges.points_reward && (
                    <span className="text-sm font-medium text-primary">
                      +{challenge.challenges.points_reward} pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};