import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EventSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

const FILTER_OPTIONS = [
  { id: 'free', label: 'Free', icon: '💰' },
  { id: 'paid', label: 'Paid', icon: '💳' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this-week', label: 'This Week', icon: '📆' },
  { id: 'near-me', label: 'Near Me', icon: '📍' },
  { id: 'available', label: 'Available Spots', icon: '✅' }
];

const SORT_OPTIONS = [
  { id: 'date', label: 'Date' },
  { id: 'price', label: 'Price' },
  { id: 'popularity', label: 'Popularity' },
  { id: 'distance', label: 'Distance' }
];

export function EventSearch({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  sortBy,
  onSortChange,
  className
}: EventSearchProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleFilterToggle = useCallback((filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    onFilterChange(newFilters);
  }, [activeFilters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    onFilterChange([]);
  }, [onFilterChange]);

  const activeFilterCount = activeFilters.length;

  const quickFilters = useMemo(() => 
    FILTER_OPTIONS.slice(0, 4), []
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="glass-input pl-10 pr-10 mobile:h-12 sm:h-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted/50"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quick Filters & Advanced Filters */}
      <div className="flex items-center gap-2 mobile:flex-wrap">
        {/* Quick Filter Chips */}
        <div className="flex gap-2 mobile:flex-wrap flex-1 min-w-0">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilters.includes(filter.id) ? "default" : "outline"}
              onClick={() => handleFilterToggle(filter.id)}
              className="cursor-pointer transition-all hover:scale-105 mobile:text-xs sm:text-sm touch-manipulation min-h-[36px] mobile:px-2 sm:px-3"
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </Badge>
          ))}
        </div>

        {/* Advanced Filters Button */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="glass-button relative mobile:min-h-[36px] sm:min-h-[32px] mobile:px-2 sm:px-3"
            >
              <SlidersHorizontal className="h-4 w-4 mobile:mr-1 sm:mr-2" />
              <span className="mobile:text-xs sm:text-sm">Filters</span>
              {activeFilterCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="glass-dropdown w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters & Sorting</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* All Filters */}
              <div>
                <h5 className="text-sm font-medium mb-2">Categories</h5>
                <div className="grid grid-cols-2 gap-2">
                  {FILTER_OPTIONS.map((filter) => (
                    <Badge
                      key={filter.id}
                      variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                      onClick={() => handleFilterToggle(filter.id)}
                      className="cursor-pointer justify-start transition-all hover:scale-105"
                    >
                      <span className="mr-2">{filter.icon}</span>
                      {filter.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h5 className="text-sm font-medium mb-2">Sort by</h5>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <Badge
                      key={option.id}
                      variant={sortBy === option.id ? "default" : "outline"}
                      onClick={() => onSortChange(option.id)}
                      className="cursor-pointer justify-center transition-all hover:scale-105"
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mobile:flex-wrap">
          <span className="text-sm text-muted-foreground mobile:text-xs">Active:</span>
          {activeFilters.map((filterId) => {
            const filter = FILTER_OPTIONS.find(f => f.id === filterId);
            if (!filter) return null;
            return (
              <Badge
                key={filterId}
                variant="secondary"
                className="cursor-pointer transition-all hover:scale-105 mobile:text-xs"
                onClick={() => handleFilterToggle(filterId)}
              >
                <span className="mr-1">{filter.icon}</span>
                {filter.label}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}