import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  mode?: 'padding' | 'margin';
}

export const SafeAreaLayout = memo(({ 
  children, 
  className,
  edges = ['top', 'bottom', 'left', 'right'],
  mode = 'padding'
}: SafeAreaLayoutProps) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const style = edges.reduce((acc, edge) => {
    const property = mode === 'padding' ? `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` : `margin${edge.charAt(0).toUpperCase() + edge.slice(1)}`;
    const insetValue = safeAreaInsets[edge as keyof typeof safeAreaInsets];
    
    // Only apply safe area if there's an actual inset
    if (insetValue > 0) {
      acc[property as keyof React.CSSProperties] = `max(1rem, ${insetValue}px)` as any;
    }
    
    return acc;
  }, {} as React.CSSProperties);

  return (
    <div 
      className={cn('safe-area-layout', className)}
      style={style}
    >
      {children}
    </div>
  );
});

// Specific layout components for common patterns
export const SafeAreaScreen = memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <SafeAreaLayout 
    className={cn('min-h-screen', className)}
    edges={['top', 'bottom', 'left', 'right']}
  >
    {children}
  </SafeAreaLayout>
));

export const SafeAreaContent = memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <SafeAreaLayout 
    className={cn('flex-1', className)}
    edges={['left', 'right']}
  >
    {children}
  </SafeAreaLayout>
));

export const SafeAreaBottom = memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <SafeAreaLayout 
    className={cn('pb-safe', className)}
    edges={['bottom']}
  >
    {children}
  </SafeAreaLayout>
));

SafeAreaLayout.displayName = 'SafeAreaLayout';
SafeAreaScreen.displayName = 'SafeAreaScreen';
SafeAreaContent.displayName = 'SafeAreaContent';
SafeAreaBottom.displayName = 'SafeAreaBottom';