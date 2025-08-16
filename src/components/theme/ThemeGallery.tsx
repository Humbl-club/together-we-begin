import React from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';

// Small, focused gallery to preview and pick brand themes visually
export const ThemeGallery: React.FC = () => {
  const { brand, availableBrands, setBrandKey } = useBrand();

  const getColor = (val?: string, fallback?: string) => {
    if (!val && fallback) return fallback;
    if (!val) return 'hsl(210 11% 88%)';
    return val.includes('hsl(') ? val : `hsl(${val})`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {availableBrands.map((b) => {
        const c = b.colors || {};
        const bg = getColor(c['--card'] || c['--background'] || '0 0% 100%');
        const primary = getColor(c['--primary'] || '140 22% 34%');
        const accent = getColor(c['--accent'] || c['--brand-accent'] || '200 30% 92%');
        const muted = getColor(c['--muted'] || '200 20% 95%');

        return (
          <button
            key={b.key}
            onClick={() => setBrandKey(b.key)}
            aria-pressed={brand.key === b.key}
            className={cn(
              'group relative rounded-xl border p-3 text-left transition-all focus:outline-none',
              'hover:shadow-lg hover:-translate-y-0.5',
              brand.key === b.key
                ? 'border-primary/40 ring-2 ring-primary/30 bg-background'
                : 'border-border/50 bg-card'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">{b.name}</span>
              {brand.key === b.key && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                  Active
                </span>
              )}
            </div>
            <div className="h-16 rounded-lg overflow-hidden border border-border/50">
              <div className="h-full w-full grid grid-cols-3">
                <div style={{ background: primary }} />
                <div style={{ background: accent }} />
                <div style={{ background: muted }} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-border/60" style={{ background: primary }} />
              <span className="h-3 w-3 rounded-full border border-border/60" style={{ background: accent }} />
              <span className="h-3 w-3 rounded-full border border-border/60" style={{ background: muted }} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
