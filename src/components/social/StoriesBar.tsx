import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryItem } from './StoryItem';

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

interface StoriesBarProps {
  stories: Post[];
  isMobile: boolean;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ stories, isMobile }) => {
  if (stories.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardHeader className={isMobile ? 'pb-3' : ''}>
        <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Stories</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : ''}>
        <div className={`flex gap-${isMobile ? '3' : '4'} overflow-x-auto pb-2`}>
          {stories.map((story) => (
            <StoryItem key={story.id} story={story} isMobile={isMobile} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};