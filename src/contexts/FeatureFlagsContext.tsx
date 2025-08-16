import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type FeatureFlags = {
  enableSEO: boolean;
  enableTenant: boolean;
  enableVirtualizedMessages: boolean;
  enableCreateEventButton: boolean;
};

type FeatureFlagsContextValue = {
  flags: FeatureFlags;
  setFlags: (updater: (prev: FeatureFlags) => FeatureFlags) => void;
  overrideFlags: (partial: Partial<FeatureFlags>) => void;
};

const defaultFlags: FeatureFlags = {
  enableSEO: true,
  enableTenant: true,
  enableVirtualizedMessages: false,
  enableCreateEventButton: false,
};

const STORAGE_KEY = 'featureFlags';

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlagsState] = useState<FeatureFlags>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultFlags, ...JSON.parse(saved) } : defaultFlags;
    } catch {
      return defaultFlags;
    }
  });

  const setFlags = (updater: (prev: FeatureFlags) => FeatureFlags) => {
    setFlagsState(prev => {
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const overrideFlags = (partial: Partial<FeatureFlags>) => {
    setFlags(prev => ({ ...prev, ...partial }));
  };

  useEffect(() => {
    // Sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setFlagsState({ ...defaultFlags, ...JSON.parse(e.newValue) }); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<FeatureFlagsContextValue>(
    () => ({ flags, setFlags, overrideFlags }),
    [flags]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  return ctx;
}
