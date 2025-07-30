import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Share2, Copy, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  postId: string;
  postContent: string;
  size?: 'sm' | 'md' | 'lg';
  isMobile?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ 
  postId, 
  postContent, 
  size = 'sm',
  isMobile = false 
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/social?post=${postId}`;
  const shareText = postContent.slice(0, 100) + (postContent.length > 100 ? '...' : '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard"
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const shareToSocial = (platform: string) => {
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      setOpen(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          text: shareText,
          url: shareUrl,
        });
        setOpen(false);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={size} className={isMobile ? 'px-2' : ''}>
          <Share2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
          {!isMobile && <span className="ml-1">Share</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Share this post</h4>
          
          {/* Native sharing for mobile */}
          {navigator.share && (
            <Button
              variant="ghost"
              size="sm"
              onClick={nativeShare}
              className="w-full justify-start"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </Button>
          )}
          
          {/* Copy link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="w-full justify-start"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </Button>
          
          {/* Social media options */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => shareToSocial('twitter')}
            className="w-full justify-start"
          >
            <Twitter className="w-4 h-4 mr-2" />
            Share on Twitter
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => shareToSocial('facebook')}
            className="w-full justify-start"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Share on Facebook
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => shareToSocial('whatsapp')}
            className="w-full justify-start"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};