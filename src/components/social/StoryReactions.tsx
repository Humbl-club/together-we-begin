import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';

interface StoryReactionsProps {
  storyId: string;
  className?: string;
}

interface Reaction {
  id: string;
  reaction: string;
  user_id: string;
  created_at: string;
}

const AVAILABLE_REACTIONS = ['❤️', '👏', '😍', '🔥', '💪', '🌟', '😂', '🥰'];

export const StoryReactions: React.FC<StoryReactionsProps> = ({ storyId, className = '' }) => {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
    subscribeToReactions();
  }, [storyId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('story_reactions')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch story reactions:', error);
      return;
    }

    setReactions(data || []);
    
    if (user) {
      const currentUserReaction = data?.find(r => r.user_id === user.id);
      setUserReaction(currentUserReaction?.reaction || null);
    }
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`story_reactions_${storyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'story_reactions',
        filter: `story_id=eq.${storyId}`
      }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const addReaction = async (reaction: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (userReaction) {
        // Update existing reaction
        const { error } = await supabase
          .from('story_reactions')
          .update({ reaction })
          .eq('story_id', storyId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('story_reactions')
          .insert({
            story_id: storyId,
            user_id: user.id,
            reaction
          });

        if (error) throw error;
      }

      setUserReaction(reaction);
      trackEvent('story_viewed');
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async () => {
    if (!user || !userReaction || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserReaction(null);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalReactions = reactions.length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={userReaction ? "default" : "outline"}
            size="sm"
            disabled={!user || loading}
            className="h-8 px-2"
          >
            {userReaction || '😍'}
            {totalReactions > 0 && (
              <span className="ml-1 text-xs">{totalReactions}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {AVAILABLE_REACTIONS.map((reaction) => (
              <Button
                key={reaction}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-primary/10"
                onClick={() => addReaction(reaction)}
                disabled={loading}
              >
                {reaction}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {userReaction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={removeReaction}
          disabled={loading}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Remove
        </Button>
      )}

      {Object.entries(groupedReactions).length > 0 && (
        <div className="flex gap-1">
          {Object.entries(groupedReactions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([reaction, count]) => (
              <div
                key={reaction}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
              >
                <span>{reaction}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};