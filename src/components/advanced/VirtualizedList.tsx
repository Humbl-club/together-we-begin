import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useViewport } from '@/hooks/use-mobile';
import { generateStableKey } from '@/utils/keyGenerators';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
}

// Advanced virtualization for large lists
export const VirtualizedList = memo(<T,>({
  items,
  renderItem,
  itemHeight,
  containerHeight = 400,
  overscan = 3,
  className = ''
}: VirtualizedListProps<T>) => {
  const { isMobile } = useViewport();
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll with requestAnimationFrame
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    requestAnimationFrame(() => {
      setScrollTop(element.scrollTop);
    });
  }, []);

  // Visible items with memoization
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  // Total height calculation
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  // Mobile-specific optimizations
  const mobileProps = isMobile ? {
    style: {
      WebkitOverflowScrolling: 'touch' as const,
    }
  } : {};

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...mobileProps}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={generateStableKey(item, visibleRange.start + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';