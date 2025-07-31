import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePostFormProps {
  newPost: string;
  setNewPost: (content: string) => void;
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  createPost: (isStory?: boolean) => void;
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
  isMobile,
}) => {
  const [isStory, setIsStory] = useState(false);
  const { toast } = useToast();

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && selectedImages.length === 0) {
      toast({
        title: 'Post is empty',
        description: 'Please add some content or images to your post',
        variant: 'destructive',
      });
      return;
    }
    createPost(isStory);
  };

  return (
    <Card className="glass-card p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create Post</h3>
        </div>

        <Textarea
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="min-h-[100px] resize-none"
        />

        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="rounded-lg w-full h-32 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center space-x-2 text-primary hover:text-primary/80">
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm">Add Images</span>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </Label>

            <div className="flex items-center space-x-2">
              <Switch
                id="story-mode"
                checked={isStory}
                onCheckedChange={setIsStory}
              />
              <Label htmlFor="story-mode" className="text-sm">
                24hr Story
              </Label>
            </div>
          </div>

          <Button type="submit" disabled={!newPost.trim() && selectedImages.length === 0}>
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
};