import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_urls: string[] | null;
  is_story: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  expires_at: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  user_liked?: boolean;
}

interface StoryItemProps {
  story: Post;
  isMobile: boolean;
}

export const StoryItem: React.FC<StoryItemProps> = ({ story, isMobile }) => {
  return (
    <div className="flex-shrink-0 text-center">
      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-0.5 hover:scale-105 transition-transform duration-300 cursor-pointer`}>
        <div className="w-full h-full rounded-full bg-background p-0.5">
          <Avatar className="w-full h-full">
            <AvatarImage src={story.profiles.avatar_url} />
            <AvatarFallback className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
              {story.profiles.full_name?.charAt(0) || story.profiles.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <p className={`text-xs mt-2 truncate ${isMobile ? 'w-16' : 'w-20'} font-medium`}>
        {story.profiles.username || story.profiles.full_name?.split(' ')[0] || 'User'}
      </p>
    </div>
  );
};