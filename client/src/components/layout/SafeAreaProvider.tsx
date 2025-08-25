import React, { createContext, useContext, useEffect, useState } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaContextType {
  insets: SafeAreaInsets;
  isReady: boolean;
}

const SafeAreaContext = createContext<SafeAreaContextType | null>(null);

export const SafeAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateInsets = () => {
      // Get safe area insets from CSS environment variables
      const computedStyle = getComputedStyle(document.documentElement);
      
      const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');
      const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0');
      const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0');

      setInsets({ top, bottom, left, right });
      setIsReady(true);
    };

    // Set CSS custom properties for safe area insets
    if (CSS.supports && CSS.supports('padding-top: env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
    }

    updateInsets();
    
    // Update insets on resize
    window.addEventListener('resize', updateInsets);
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return (
    <SafeAreaContext.Provider value={{ insets, isReady }}>
      {children}
    </SafeAreaContext.Provider>
  );
};

export const useSafeArea = () => {
  const context = useContext(SafeAreaContext);
  if (!context) {
    throw new Error('useSafeArea must be used within a SafeAreaProvider');
  }
  return context;
};