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
      <CardHeader className={isMobile ? 'pb-4 px-5 pt-5' : 'pb-4'}>
        <CardTitle className={`${isMobile ? 'text-xl' : 'text-xl'} font-bold`}>Stories</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0 px-5 pb-5' : 'pt-0'}>
        <div className={`flex ${isMobile ? 'gap-5' : 'gap-6'} overflow-x-auto pb-3 scrollbar-hide ios-scroll`}>
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center touch-target-large">
            <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-primary/25 to-primary/15 border-3 border-dashed border-primary/40 flex items-center justify-center hover:border-primary/60 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}>
              <Plus className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-primary`} strokeWidth={2.5} />
            </div>
            <p className={`text-xs mt-2 truncate ${isMobile ? 'w-20' : 'w-24'} font-bold text-primary`}>
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