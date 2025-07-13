import React, { memo, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface FeedPostProps {
  author: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  achievement?: {
    type: string;
    title: string;
  };
}

const FeedPost: React.FC<FeedPostProps> = memo(({
  author,
  content,
  image,
  likes,
  comments,
  timestamp,
  achievement
}) => {
  const authorInitials = useMemo(() => 
    author.name.split(' ').map(n => n[0]).join(''), [author.name]
  );

  return (
    <Card className="border-0 shadow-none bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm leading-none">{author.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">@{author.handle} • {timestamp}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Achievement Badge */}
        {achievement && (
          <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
            {achievement.type}: {achievement.title}
          </Badge>
        )}

        {/* Content */}
        <p className="text-sm leading-relaxed mb-4">{content}</p>

        {/* Image */}
        {image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={image} 
              alt="Post content" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-0">
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">{likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-0">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{comments}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default FeedPost;