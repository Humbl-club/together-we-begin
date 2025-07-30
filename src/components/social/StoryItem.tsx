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
    <div className="flex-shrink-0 text-center touch-target-large">
      <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-1 hover:scale-110 transition-transform duration-500 cursor-pointer shadow-lg hover:shadow-xl`}>
        <div className="w-full h-full rounded-full bg-background p-1 shadow-inner">
          <Avatar className="w-full h-full shadow-md">
            <AvatarImage src={story.profiles.avatar_url} className="object-cover" />
            <AvatarFallback className={`${isMobile ? 'text-sm' : 'text-base'} font-bold bg-gradient-to-br from-primary/20 to-secondary/20`}>
              {story.profiles.full_name?.charAt(0) || story.profiles.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <p className={`text-xs mt-2 truncate ${isMobile ? 'w-20' : 'w-24'} font-semibold`}>
        {story.profiles.username || story.profiles.full_name?.split(' ')[0] || 'User'}
      </p>
    </div>
  );
};