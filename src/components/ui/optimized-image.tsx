import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLazyLoading } from '@/hooks/usePerformanceOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  lowQualitySrc?: string;
  blurhash?: string;
  aspectRatio?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: string; // Keep for backward compatibility
}

export const OptimizedImage = memo(({ 
  src, 
  fallbackSrc, 
  lowQualitySrc,
  blurhash,
  aspectRatio,
  sizes,
  priority = false,
  fallback = '/placeholder.svg', // Backward compatibility
  className,
  alt = '',
  ...props 
}: OptimizedImageProps) => {
  const finalSrc = src || fallback;
  const [imageSrc, setImageSrc] = useState(priority ? finalSrc : lowQualitySrc || '');
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [shouldLoad, setShouldLoad] = useState(priority);
  const { observe } = useLazyLoading();

  const imageRef = React.useRef<HTMLImageElement>(null);

  // Use fallback prop for backward compatibility
  const finalFallback = fallbackSrc || fallback;

  useEffect(() => {
    if (!priority && imageRef.current && finalSrc) {
      const img = imageRef.current;
      img.dataset.src = finalSrc;
      observe(img);
      
      // Set up intersection observer callback
      const checkLoad = () => {
        if (img.src === finalSrc) {
          setShouldLoad(true);
        }
      };
      
      img.addEventListener('load', checkLoad);
      return () => img.removeEventListener('load', checkLoad);
    }
  }, [finalSrc, priority, observe]);

  useEffect(() => {
    if (!shouldLoad || !finalSrc) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(finalSrc);
      setImageState('loaded');
    };
    
    img.onerror = () => {
      if (finalFallback) {
        setImageSrc(finalFallback);
        setImageState('loaded');
      } else {
        setImageState('error');
      }
    };
    
    img.src = finalSrc;
  }, [finalSrc, shouldLoad, finalFallback]);

  if (imageState === 'error' && !finalFallback) {
    return (
      <div 
        className={cn(
          'bg-muted flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ aspectRatio }}
      >
        <span className="text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
      {/* Blurhash or low quality placeholder */}
      {(imageState === 'loading' || (lowQualitySrc && imageState !== 'loaded')) && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Main image */}
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        sizes={sizes}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
        )}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
      
      {/* Loading overlay */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});