import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Play, ArrowRight } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useMobileFirst } from '../../../hooks/useMobileFirst';

interface SocialWidgetProps {
  configuration: {
    showImages?: boolean;
    showVideos?: boolean;
    maxPosts?: number;
    viewMode?: 'feed' | 'compact' | 'stories';
    showEngagement?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface SocialPost {
  id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  is_story: boolean;
  story_expires_at?: string;
  author: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  engagement: {
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
  };
}

export const SocialWidget: React.FC<SocialWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const { isMobile } = useMobileFirst();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'posts' | 'stories'>('posts');

  const {
    showImages = true,
    showVideos = true,
    maxPosts = size === 'small' ? 3 : size === 'medium' ? 5 : 8,
    viewMode = size === 'small' ? 'compact' : 'feed',
    showEngagement = true
  } = configuration;

  useEffect(() => {
    loadSocialContent();
  }, [currentOrganization?.id, activeView]);

  const loadSocialContent = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Base query
      let query = supabase
        .from('social_posts')
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url
          ),
          post_likes (count),
          post_comments (count)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'published');

      if (activeView === 'stories') {
        query = query
          .eq('is_story', true)
          .gt('story_expires_at', new Date().toISOString());
      } else {
        query = query.eq('is_story', false);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(maxPosts);

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Check user likes
      let userLikes: string[] = [];
      if (userId && postsData.length > 0) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postsData.map(p => p.id));
        
        userLikes = likesData?.map(l => l.post_id) || [];
      }

      // Format posts
      const formattedPosts = postsData.map(post => ({
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        video_url: post.video_url,
        created_at: post.created_at,
        is_story: post.is_story,
        story_expires_at: post.story_expires_at,
        author: {
          id: post.profiles.id,
          full_name: post.profiles.full_name || 'Unknown User',
          avatar_url: post.profiles.avatar_url
        },
        engagement: {
          likes_count: post.post_likes?.[0]?.count || 0,
          comments_count: post.post_comments?.[0]?.count || 0,
          is_liked: userLikes.includes(post.id)
        }
      }));

      if (activeView === 'stories') {
        setStories(formattedPosts);
      } else {
        setPosts(formattedPosts);
      }

    } catch (error) {
      console.error('Error loading social content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return postDate.toLocaleDateString();
  };

  const renderStoriesBar = () => {
    if (!stories.length) return null;

    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stories.slice(0, 6).map((story) => (
          <div key={story.id} className="flex-shrink-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 p-0.5">
                <Avatar className="w-full h-full border-2 border-white">
                  <AvatarImage src={story.author.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {story.author.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {story.image_url && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Image className="w-3 h-3 text-white" />
                </div>
              )}
              {story.video_url && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Play className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="text-xs text-center mt-1 truncate w-14">
              {story.author.full_name.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompactPost = (post: SocialPost) => (
    <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={post.author.avatar_url} />
          <AvatarFallback className="text-xs">
            {post.author.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {post.author.full_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(post.created_at)}
            </span>
          </div>
          
          <p className="text-sm text-gray-900 line-clamp-2 mb-2">
            {post.content}
          </p>

          {showEngagement && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.engagement.likes_count}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.engagement.comments_count}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFeedPost = (post: SocialPost) => (
    <Card key={post.id} className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback>
                {post.author.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="font-semibold text-sm">
                {post.author.full_name}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(post.created_at)}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm text-gray-900 line-clamp-3">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {showImages && post.image_url && (
          <div className="mb-3 -mx-4">
            <img 
              src={post.image_url} 
              alt="Post content"
              className="w-full max-h-48 object-cover"
            />
          </div>
        )}

        {showVideos && post.video_url && (
          <div className="mb-3 -mx-4 relative">
            <video 
              src={post.video_url} 
              className="w-full max-h-48 object-cover"
              controls={false}
              poster={post.image_url}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-80" />
            </div>
          </div>
        )}

        {/* Engagement */}
        {showEngagement && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="p-1">
                <Heart 
                  className={`w-5 h-5 ${
                    post.engagement.is_liked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} 
                />
                <span className="ml-1 text-sm">{post.engagement.likes_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="p-1">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                <span className="ml-1 text-sm">{post.engagement.comments_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="p-1">
                <Share2 className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPosts = activeView === 'stories' ? stories : posts;

  if (currentPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">
          No {activeView === 'stories' ? 'stories' : 'posts'} yet
        </div>
        <Button size="sm" variant="outline">
          Create {activeView === 'stories' ? 'Story' : 'Post'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      {(size === 'large' || size === 'full') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'posts' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView('posts')}
            >
              Posts
            </Button>
            <Button
              variant={activeView === 'stories' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView('stories')}
            >
              Stories
            </Button>
          </div>
          <Badge variant="outline">
            {currentPosts.length} {activeView}
          </Badge>
        </div>
      )}

      {/* Stories Bar */}
      {activeView === 'stories' && stories.length > 0 && renderStoriesBar()}

      {/* Posts Feed */}
      {activeView === 'posts' && (
        <div className="space-y-3">
          {viewMode === 'compact' 
            ? posts.map(renderCompactPost)
            : posts.map(renderFeedPost)
          }
          
          {posts.length >= maxPosts && (
            <Button variant="ghost" size="sm" className="w-full">
              View More Posts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};