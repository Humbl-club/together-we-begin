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
      <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full bg-gradient-primary p-1`}>
        <Avatar className="w-full h-full">
          <AvatarImage src={story.profiles.avatar_url} />
          <AvatarFallback className={isMobile ? 'text-xs' : ''}>
            {story.profiles.full_name?.charAt(0) || story.profiles.username?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className={`text-xs mt-1 truncate ${isMobile ? 'w-14' : 'w-16'}`}>
        {story.profiles.username || story.profiles.full_name}
      </p>
    </div>
  );
};