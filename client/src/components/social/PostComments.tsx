import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface PostCommentsProps {
  postId: string;
  currentUserId: string | undefined;
  onComment: (postId: string, content: string) => void;
}

export const PostComments: React.FC<PostCommentsProps> = ({
  postId,
  currentUserId,
  onComment,
}) => {
  const [comments, setComments] = useState<Tables<'post_comments'>[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Tables<'profiles'>>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data);
      
      // Fetch profiles for commenters
      const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))] as string[];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesData) {
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, Tables<'profiles'>>);
        setProfiles(profilesMap);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmitting(true);
    await onComment(postId, newComment);
    setNewComment('');
    setIsSubmitting(false);
    
    // Refresh comments
    fetchComments();
  };

  return (
    <div className="space-y-3 border-t pt-3">
      {comments.map((comment) => {
        const profile = comment.user_id ? profiles[comment.user_id] : undefined;
        return (
          <div key={comment.id} className="flex space-x-2">
            <Avatar className="w-8 h-8">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}`}
                alt={profile?.full_name || 'User'}
              />
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm font-semibold">{profile?.full_name || 'Anonymous'}</p>
                <p className="text-sm">{comment.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Unknown time'}
              </p>
            </div>
          </div>
        );
      })}

      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
};