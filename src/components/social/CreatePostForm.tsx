import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera } from 'lucide-react';

interface CreatePostFormProps {
  newPost: string;
  setNewPost: (value: string) => void;
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  createPost: (isStory?: boolean) => Promise<void>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMobile: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  newPost,
  setNewPost,
  selectedImages,
  setSelectedImages,
  createPost,
  handleImageSelect,
  isMobile
}) => {
  return (
    <Card className="glass-card">
      <CardContent className={isMobile ? 'pt-4' : 'pt-6'}>
        <Tabs defaultValue="post" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post" className={isMobile ? 'text-sm' : ''}>
              {isMobile ? 'Post' : 'Create Post'}
            </TabsTrigger>
            <TabsTrigger value="story" className={isMobile ? 'text-sm' : ''}>
              {isMobile ? 'Story' : 'Create Story'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="post" className={`space-y-${isMobile ? '3' : '4'}`}>
            <Textarea
              placeholder="Share your thoughts with the community..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className={`${isMobile ? 'min-h-[80px] text-sm' : 'min-h-[100px]'}`}
            />
            
            <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
              <div className={`flex gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'sm'}
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className={isMobile ? 'flex-1' : ''}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isMobile ? `Photos (${selectedImages.length}/5)` : `Photos (${selectedImages.length}/5)`}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <Button
                onClick={() => createPost(false)}
                disabled={!newPost.trim() && selectedImages.length === 0}
                className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
              >
                {isMobile ? 'Share' : 'Share Post'}
              </Button>
            </div>
            
            {selectedImages.length > 0 && (
              <div className={`flex gap-2 flex-wrap ${isMobile ? 'justify-center' : ''}`}>
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded-lg`}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className={`absolute -top-2 -right-2 ${isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6'} rounded-full p-0`}
                      onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="story" className={`space-y-${isMobile ? '3' : '4'}`}>
            <Textarea
              placeholder="Share a 24-hour story..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className={`${isMobile ? 'min-h-[80px] text-sm' : 'min-h-[100px]'}`}
            />
            
            <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
              <div className={`flex gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('story-image-upload')?.click()}
                  className={isMobile ? 'flex-1' : ''}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isMobile ? `Photos (${selectedImages.length}/5)` : `Photos (${selectedImages.length}/5)`}
                </Button>
                <input
                  id="story-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <Button
                onClick={() => createPost(true)}
                disabled={!newPost.trim() && selectedImages.length === 0}
                className={`bg-gradient-primary text-white ${isMobile ? 'w-full' : ''}`}
              >
                {isMobile ? 'Share' : 'Share Story'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};