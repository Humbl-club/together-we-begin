import { useState, useCallback } from 'react';
import Compressor from 'compressorjs';

interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertSize?: number;
  convertTypes?: string[];
}

export const useImageOptimization = () => {
  const [processing, setProcessing] = useState(false);

  const optimizeImage = useCallback(async (
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ optimized: File; thumbnail: File; preview: string }> => {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1920,
      convertSize = 2 * 1024 * 1024, // 2MB
      convertTypes = ['image/png', 'image/bmp', 'image/tiff']
    } = options;

    setProcessing(true);

    try {
      // Convert to WebP if file is large or specific type
      const shouldConvert = file.size > convertSize || convertTypes.includes(file.type);
      const mimeType = shouldConvert ? 'image/webp' : file.type;

      // Create optimized version
      const optimized = await new Promise<File>((resolve, reject) => {
        new Compressor(file, {
          quality,
          maxWidth,
          maxHeight,
          mimeType,
          convertSize,
          success: (file: File) => resolve(file),
          error: reject,
        });
      });

      // Create thumbnail
      const thumbnail = await new Promise<File>((resolve, reject) => {
        new Compressor(file, {
          quality: 0.6,
          maxWidth: 300,
          maxHeight: 300,
          mimeType: 'image/webp',
          success: (file: File) => resolve(file),
          error: reject,
        });
      });

      // Create preview URL
      const preview = URL.createObjectURL(optimized);

      return { optimized, thumbnail, preview };
    } finally {
      setProcessing(false);
    }
  }, []);

  const createProgressiveImage = useCallback((src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Create a low-quality placeholder
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 10;
      canvas.height = 10;
      
      if (ctx) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 10, 10);
        img.src = canvas.toDataURL();
      }

      // Load the actual image
      const actualImg = new Image();
      actualImg.onload = () => {
        img.src = actualImg.src;
        resolve(img);
      };
      actualImg.onerror = reject;
      actualImg.src = src;
    });
  }, []);

  return {
    optimizeImage,
    createProgressiveImage,
    processing
  };
};