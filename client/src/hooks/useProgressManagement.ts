import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface ProgressUpdate {
  challengeId: string;
  currentSteps: number;
  targetSteps: number;
  progressPercent: number;
  isCompleted: boolean;
  completionTime?: string;
  badgeAwarded?: string;
  pointsAwarded?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  challenge_id: string;
  awarded_at: string;
}

export const useProgressManagement = () => {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Check and update progress for all active challenges
  const checkProgressUpdates = useCallback(async () => {
    if (!user || !currentOrganization || processing) return;

    setProcessing(true);
    try {
      // Get user's active challenge participations for current organization
      const { data: participations, error: participationError } = await supabase
        .from('challenge_participations')
        .select(`
          challenge_id,
          completed,
          completion_date,
          challenges!challenge_id (
            id,
            title,
            step_goal,
            status,
            end_date,
            auto_award_enabled,
            participation_reward_points,
            badge_name,
            badge_image_url
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .eq('completed', false);

      if (participationError) throw participationError;

      const updates: ProgressUpdate[] = [];

      for (const participation of participations || []) {
        const challenge = (participation.challenges as any);
        if (!challenge || challenge.status !== 'active') continue;

        // Get current step count from leaderboard
        const { data: leaderboardData } = await supabase
          .from('walking_leaderboards')
          .select('total_steps')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .single();

        const currentSteps = leaderboardData?.total_steps || 0;
        const targetSteps = challenge.step_goal || 0;
        const progressPercent = targetSteps > 0 ? (currentSteps / targetSteps) * 100 : 0;
        const isCompleted = currentSteps >= targetSteps;

        // Check if we need to mark as completed
        if (isCompleted && !participation.completed) {
          await markChallengeCompleted(challenge.id, currentSteps, challenge);
        }

        updates.push({
          challengeId: challenge.id,
          currentSteps,
          targetSteps,
          progressPercent: Math.min(progressPercent, 100),
          isCompleted,
          completionTime: participation.completion_date,
          badgeAwarded: challenge.badge_name,
          pointsAwarded: challenge.participation_reward_points
        });
      }

      setProgressUpdates(updates);
    } catch (error) {
      console.error('Error checking progress updates:', error);
    } finally {
      setProcessing(false);
    }
  }, [user, currentOrganization, processing]);

  // Mark challenge as completed and award rewards
  const markChallengeCompleted = async (
    challengeId: string, 
    finalSteps: number, 
    challenge: any
  ) => {
    if (!user || !currentOrganization) return;

    try {
      const completionTime = new Date().toISOString();

      // Update participation record
      const { error: updateError } = await supabase
        .from('challenge_participations')
        .update({
          completed: true,
          completion_date: completionTime,
          progress_data: {
            final_steps: finalSteps,
            completion_time: completionTime,
            auto_completed: true
          }
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id);

      if (updateError) throw updateError;

      // Award participation points if enabled
      if (challenge.auto_award_enabled && challenge.participation_reward_points > 0) {
        const { error: pointsError } = await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user.id,
            organization_id: currentOrganization.id,
            type: 'earned',
            points: challenge.participation_reward_points,
            description: `Challenge completion: ${challenge.title}`,
            reference_type: 'challenge_completion',
            reference_id: challengeId
          });

        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        }
      }

      // Award badge if specified
      if (challenge.badge_name && challenge.auto_award_enabled) {
        await awardBadge(challengeId, challenge.badge_name, challenge.badge_image_url);
      }

      toast({
        title: "Challenge Completed! 🎉",
        description: `Congratulations on completing "${challenge.title}"!`
      });

    } catch (error) {
      console.error('Error marking challenge completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark challenge as completed",
        variant: "destructive"
      });
    }
  };

  // Award badge to user
  const awardBadge = async (challengeId: string, badgeName: string, badgeImageUrl?: string) => {
    if (!user) return;

    try {
      // Create a simple badge record (you might want to create a badges table)
      const badgeRecord: Badge = {
        id: `${challengeId}_${user.id}_${Date.now()}`,
        name: badgeName,
        description: `Awarded for completing challenge`,
        image_url: badgeImageUrl,
        challenge_id: challengeId,
        awarded_at: new Date().toISOString()
      };

      // For now, store in local state - in production you'd want a proper badges table
      setUserBadges(prev => [...prev, badgeRecord]);

      toast({
        title: "Badge Earned! 🏆",
        description: `You've earned the "${badgeName}" badge!`
      });

    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  // Verify completion with additional validation
  const verifyCompletion = async (challengeId: string, reportedSteps: number) => {
    if (!user || !currentOrganization) return { verified: false, reason: 'User not authenticated or no organization selected' };

    try {
      // Get validation logs for this user and challenge in current organization
      const { data: validationLogs } = await supabase
        .from('step_validation_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate average validation score
      const avgScore = validationLogs?.reduce((sum, log) => sum + (log.validation_score || 0), 0) / (validationLogs?.length || 1);
      
      // Check for suspicious patterns
      const hasAnomalies = validationLogs?.some(log => 
        log.anomaly_flags && (log.anomaly_flags as string[]).length > 0
      );

      // Verification criteria
      const isVerified = avgScore >= 0.7 && !hasAnomalies && reportedSteps > 0;
      
      return {
        verified: isVerified,
        score: avgScore,
        reason: !isVerified ? 'Step validation failed or suspicious activity detected' : 'Verified'
      };

    } catch (error) {
      console.error('Error verifying completion:', error);
      return { verified: false, reason: 'Verification failed' };
    }
  };

  // Get progress for specific challenge
  const getProgressForChallenge = (challengeId: string): ProgressUpdate | undefined => {
    return progressUpdates.find(p => p.challengeId === challengeId);
  };

  // Manual completion trigger (for admin use)
  const manuallyCompleteChallenge = async (challengeId: string, userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId || !currentOrganization) return;

    try {
      const { error } = await supabase
        .from('challenge_participations')
        .update({
          completed: true,
          completion_date: new Date().toISOString(),
          progress_data: { manually_completed: true }
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', targetUserId)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: "Challenge Marked Complete",
        description: "Challenge has been manually marked as completed"
      });

      await checkProgressUpdates();
    } catch (error) {
      console.error('Error manually completing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete challenge",
        variant: "destructive"
      });
    }
  };

  // Auto-check progress every 30 seconds when user is active
  useEffect(() => {
    if (!user || !currentOrganization) return;

    checkProgressUpdates(); // Initial check

    const interval = setInterval(() => {
      checkProgressUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, currentOrganization?.id, checkProgressUpdates]);

  return {
    progressUpdates,
    userBadges,
    processing,
    checkProgressUpdates,
    verifyCompletion,
    getProgressForChallenge,
    manuallyCompleteChallenge,
    awardBadge
  };
};