import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Compressor from "compressorjs";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateMultipleImageFiles } from "@/utils/fileValidation";

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  bucket: string;
  path?: string;
  accept?: string[];
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  maxFiles = 3,
  maxSize = 5,
  bucket,
  path = "",
  accept = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        convertTypes: ["image/png"],
        convertSize: 1000000, // Convert to JPEG if larger than 1MB
        success: (compressedFile) => {
          resolve(compressedFile as File);
        },
        error: reject,
      });
    });
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Validate all files before processing
    const { validFiles, errors } = await validateMultipleImageFiles(acceptedFiles, maxSize);
    
    if (errors.length > 0) {
      toast({
        title: "Invalid files",
        description: errors.join(", "),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    const newUrls: string[] = [];

    try {
      for (const file of validFiles) {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Upload to Supabase
        const url = await uploadToSupabase(compressedFile);
        newUrls.push(url);
      }

      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setUploadedUrls(allUrls);
      onUploadComplete(allUrls);

      toast({
        title: "Upload successful",
        description: `${newUrls.length} image(s) uploaded and optimized`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [uploadedFiles.length, maxFiles, maxSize, bucket, path, uploadedUrls, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploading || uploadedFiles.length >= maxFiles
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setUploadedUrls(newUrls);
    onUploadComplete(newUrls);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {uploadedFiles.length < maxFiles && (
        <Card
          {...getRootProps()}
          className={`border-dashed cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <CardContent className="p-6 text-center">
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading and optimizing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop images here" : "Click or drag images to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max {maxFiles} files, {maxSize}MB each. Images will be optimized.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploaded Images</p>
            <Badge variant="secondary">{uploadedFiles.length}/{maxFiles}</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                    {file.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}