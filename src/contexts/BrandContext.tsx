import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BrandConfig = {
  key: string;
  name: string;
  logoUrl?: string;
  colors?: Partial<Record<string, string>>; // CSS variable map e.g. { '--brand-accent': 'hsl(280 80% 60%)' }
};

type BrandContextValue = {
  brand: BrandConfig;
  setBrandKey: (key: string) => void;
  availableBrands: BrandConfig[];
};

const defaultBrands: BrandConfig[] = [
  {
    key: 'together',
    name: 'Together',
    logoUrl: '/favicon.png',
    colors: {
      '--brand-accent': 'hsl(275 81% 60%)',
    },
  },
  {
    key: 'aurora',
    name: 'Aurora Club',
    colors: {
      '--brand-accent': 'hsl(199 89% 48%)',
    },
  },
];

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

function applyBrandVariables(brand: BrandConfig) {
  const root = document.documentElement;
  root.setAttribute('data-brand', brand.key);
  root.style.setProperty('--brand-name', `'${brand.name}'`);
  if (brand.colors) {
    Object.entries(brand.colors).forEach(([k, v]) => {
      try { root.style.setProperty(k, v); } catch {}
    });
  }
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandKey, setBrandKeyState] = useState<string>(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('brand');
    return fromQuery || localStorage.getItem('brand') || defaultBrands[0].key;
  });

  const setBrandKey = (key: string) => {
    setBrandKeyState(key);
    localStorage.setItem('brand', key);
  };

  const brand = useMemo(
    () => defaultBrands.find(b => b.key === brandKey) || defaultBrands[0],
    [brandKey]
  );

  useEffect(() => {
    applyBrandVariables(brand);
  }, [brand]);

  const value = useMemo<BrandContextValue>(
    () => ({ brand, setBrandKey, availableBrands: defaultBrands }),
    [brand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
