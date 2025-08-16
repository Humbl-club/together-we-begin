import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  onLoadComplete?: () => void;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt = '',
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3C/svg%3E',
  onLoadComplete,
  className,
  aspectRatio = 'auto',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;
    
    const img = new Image();
    img.src = src;
    
    const handleLoad = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoadComplete?.();
    };
    
    const handleError = () => {
      console.error(`Failed to load image: ${src}`);
      setImageSrc(fallback);
      setIsLoading(false);
    };
    
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    
    // Clean up
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [isInView, src, fallback, onLoadComplete]);
  
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  };
  
  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 loading-skeleton" />
      )}
      
      {/* Actual image */}
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
};

// Export a simpler version for avatars that doesn't need aspect ratio wrapper
export const OptimizedAvatar: React.FC<OptimizedImageProps> = (props) => {
  return <OptimizedImage {...props} aspectRatio="square" />;
};