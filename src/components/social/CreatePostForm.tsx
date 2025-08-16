import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateImageFile } from '@/utils/fileValidation';
import { generateStableKey, generateMediaKey } from '@/utils/keyGenerators';

interface CreatePostFormProps {
  onSubmit: (content: string, images: File[], isStory: boolean) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
  defaultIsStory?: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  onSubmit,
  isSubmitting,
  onClose,
  defaultIsStory = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isStory, setIsStory] = useState(defaultIsStory ?? false);
  const { toast } = useToast();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast({
        title: 'Too many images',
        description: 'You can only upload up to 4 images per post',
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    for (const file of files) {
      if (validFiles.length >= 4 - selectedImages.length) break;
      
      const validation = await validateImageFile(file);
      
      if (!validation.valid) {
        toast({
          title: "Invalid Image",
          description: validation.error,
          variant: "destructive"
        });
        continue;
      }

      validFiles.push(file);
      newUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedImages([...selectedImages, ...validFiles]);
      setPreviewUrls([...previewUrls, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0) {
      toast({
        title: 'Post is empty',
        description: 'Please add some content or images to your post',
        variant: 'destructive',
      });
      return;
    }

    await onSubmit(content, selectedImages, isStory);
    
    // Clean up
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setContent('');
    setSelectedImages([]);
    setPreviewUrls([]);
    setIsStory(false);
  };

  return (
    <Card className="glass-card p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create Post</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />

        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {previewUrls.map((url, index) => (
              <div key={generateMediaKey(url, index)} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="rounded-lg w-full h-32 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
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
                disabled={isSubmitting}
              />
            </Label>

            <div className="flex items-center space-x-2">
              <Switch
                id="story-mode"
                checked={isStory}
                onCheckedChange={setIsStory}
                disabled={isSubmitting}
              />
              <Label htmlFor="story-mode" className="text-sm">
                24hr Story
              </Label>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || (!content.trim() && selectedImages.length === 0)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </Card>
  );
};