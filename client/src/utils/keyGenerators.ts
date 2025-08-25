// Utility functions for generating stable keys for React lists
// This replaces all instances of using array index as keys

/**
 * Generate a stable key for React list items
 * Use object properties that are unique and stable
 */
export const generateStableKey = (item: any, index: number): string => {
  // Try to use id first (most stable)
  if (item?.id) {
    return String(item.id);
  }
  
  // Try other unique identifiers
  if (item?.user_id) {
    return `user-${item.user_id}`;
  }
  
  if (item?.post_id) {
    return `post-${item.post_id}`;
  }
  
  if (item?.event_id) {
    return `event-${item.event_id}`;
  }
  
  if (item?.challenge_id) {
    return `challenge-${item.challenge_id}`;
  }
  
  // For file uploads, use file properties
  if (item?.name && item?.size && item?.lastModified) {
    return `file-${item.name}-${item.size}-${item.lastModified}`;
  }
  
  // For date-based items
  if (item?.created_at) {
    return `created-${item.created_at}-${index}`;
  }
  
  if (item?.timestamp) {
    return `time-${item.timestamp}-${index}`;
  }
  
  // For simple string/number items
  if (typeof item === 'string' || typeof item === 'number') {
    return `item-${item}-${index}`;
  }
  
  // Last resort: generate from content hash
  const content = JSON.stringify(item);
  const hash = simpleHash(content);
  return `hash-${hash}-${index}`;
};

/**
 * Generate keys for leaderboard entries
 */
export const generateLeaderboardKey = (entry: any, rank: number): string => {
  if (entry?.user_id) {
    return `leaderboard-${entry.user_id}-${rank}`;
  }
  return `leaderboard-entry-${rank}`;
};

/**
 * Generate keys for step tracking data
 */
export const generateStepKey = (date: string, value: number): string => {
  return `step-${date}-${value}`;
};

/**
 * Generate keys for chart data points
 */
export const generateChartKey = (dataPoint: any, index: number): string => {
  if (dataPoint?.name || dataPoint?.label) {
    return `chart-${dataPoint.name || dataPoint.label}`;
  }
  if (dataPoint?.date) {
    return `chart-${dataPoint.date}`;
  }
  return `chart-point-${index}`;
};

/**
 * Generate keys for navigation items
 */
export const generateNavKey = (item: any, index: number): string => {
  if (item?.href || item?.to) {
    return `nav-${item.href || item.to}`;
  }
  if (item?.name || item?.title) {
    return `nav-${item.name || item.title}`;
  }
  return `nav-item-${index}`;
};

/**
 * Generate keys for form fields
 */
export const generateFieldKey = (field: any, index: number): string => {
  if (field?.name) {
    return `field-${field.name}`;
  }
  if (field?.id) {
    return `field-${field.id}`;
  }
  return `field-${index}`;
};

/**
 * Generate keys for media items (images, videos)
 */
export const generateMediaKey = (item: any, index: number): string => {
  if (typeof item === 'string') {
    // URL or filename
    const filename = item.split('/').pop() || item;
    return `media-${filename}-${index}`;
  }
  
  if (item?.url) {
    const filename = item.url.split('/').pop() || 'media';
    return `media-${filename}-${index}`;
  }
  
  return `media-${index}`;
};

/**
 * Simple hash function for generating consistent keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Type-safe key generator that preserves type information
 */
export function createKeyGenerator<T>(keyExtractor: (item: T, index: number) => string) {
  return (items: T[]) => {
    return items.map((item, index) => ({
      key: keyExtractor(item, index),
      item,
      index
    }));
  };
}

/**
 * Hook for generating stable keys in components
 */
export const useStableKeys = <T>(items: T[], keyExtractor?: (item: T, index: number) => string) => {
  const generator = keyExtractor || generateStableKey;
  return items.map((item, index) => ({
    key: generator(item, index),
    item,
    index
  }));
};