import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Reaction {
  id: string;
  reaction: string;
  user_id: string;
  created_at: string;
}

interface EmojiReactionsProps {
  postId: string;
  className?: string;
  isMobile?: boolean;
}

const AVAILABLE_REACTIONS = ['❤️', '👍', '😍', '😂', '😮', '😢', '😡', '👏', '🙌', '🔥'];

export const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
  postId, 
  className = '',
  isMobile = false 
}) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReactions();
    subscribeToReactions();
  }, [postId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId);

      if (error) throw error;

      setReactions(data || []);
      
      if (user) {
        const currentUserReaction = data?.find(r => r.user_id === user.id);
        setUserReaction(currentUserReaction?.reaction || null);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`
        }, 
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const addReaction = async (reaction: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to posts",
        variant: "destructive"
      });
      return;
    }

    try {
      // Remove existing reaction if any
      if (userReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      }

      // Add new reaction if different from current
      if (reaction !== userReaction) {
        await supabase
          .from('post_reactions')
          .insert([{
            post_id: postId,
            user_id: user.id,
            reaction: reaction
          }]);
      }

      setOpen(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive"
      });
    }
  };

  const removeReaction = async () => {
    if (!user || !userReaction) return;

    try {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive"
      });
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalReactions = reactions.length;
  const mostPopularReactions = Object.entries(groupedReactions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Show current user's reaction */}
      {userReaction ? (
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "sm"}
          onClick={removeReaction}
          className="text-blue-500 hover:text-blue-600"
        >
          <span className={isMobile ? 'text-sm mr-1' : 'mr-1'}>{userReaction}</span>
          <span className={isMobile ? 'text-xs' : 'text-sm'}>Remove</span>
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size={isMobile ? "sm" : "sm"}>
              <Plus className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
              {!isMobile && <span className="ml-1">React</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">React to this post</h4>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => addReaction(emoji)}
                    className="h-10 w-10 p-0 text-lg hover:bg-muted"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Show popular reactions */}
      {mostPopularReactions.length > 0 && (
        <div className={`flex items-center gap-1 ${isMobile ? 'ml-1' : 'ml-2'}`}>
          {mostPopularReactions.map(([emoji, count]) => (
            <div key={emoji} className={`flex items-center bg-muted rounded-full px-2 py-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span className="mr-1">{emoji}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))}
          {totalReactions > 3 && (
            <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              +{totalReactions - mostPopularReactions.reduce((sum, [,count]) => sum + count, 0)} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};