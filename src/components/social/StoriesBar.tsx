import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryItem } from './StoryItem';
import { Plus } from 'lucide-react';

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
    <Card className="glass-card-enhanced">
      <CardHeader className={isMobile ? 'pb-4 px-4 pt-4' : 'pb-4'}>
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Stories</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0 px-4 pb-4' : 'pt-0'}>
        <div className={`flex ${isMobile ? 'gap-4' : 'gap-6'} overflow-x-auto pb-2 scrollbar-hide`}>
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center hover:border-primary/50 transition-all duration-300 cursor-pointer`}>
              <Plus className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary`} />
            </div>
            <p className={`text-xs mt-2 truncate ${isMobile ? 'w-16' : 'w-20'} font-medium text-primary`}>
              Add Story
            </p>
          </div>
          
          {stories.map((story) => (
            <StoryItem key={story.id} story={story} isMobile={isMobile} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};