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
      '--primary': '199 89% 48%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '173 63% 50%',
      '--muted': '200 20% 96%',
      '--card': '0 0% 100%',
      '--background': '210 40% 98%',
      '--foreground': '210 10% 15%',
      '--border': '200 15% 88%',
      '--ring': '199 89% 48%'
    },
  },
  {
    key: 'classic',
    name: 'Classic Plum',
    colors: {
      '--brand-accent': 'hsl(275 60% 52%)',
      '--primary': '275 60% 52%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '330 45% 90%',
      '--muted': '280 20% 96%',
      '--card': '0 0% 100%',
      '--background': '0 0% 99%',
      '--foreground': '230 15% 15%',
      '--border': '270 15% 90%',
      '--ring': '275 60% 52%'
    },
  },
  {
    key: 'noir',
    name: 'Noir Ivory',
    colors: {
      '--brand-accent': 'hsl(260 5% 90%)',
      '--background': '240 10% 5%',
      '--foreground': '0 0% 98%',
      '--primary': '260 5% 90%',
      '--primary-foreground': '240 10% 10%',
      '--secondary': '240 6% 12%',
      '--muted': '240 6% 12%',
      '--card': '240 8% 7%',
      '--accent': '280 5% 15%',
      '--border': '240 6% 18%',
      '--ring': '260 5% 90%'
    },
  },
  {
    key: 'blush',
    name: 'Blush Rose',
    colors: {
      '--brand-accent': 'hsl(330 70% 56%)',
      '--background': '40 30% 98%',
      '--foreground': '330 25% 20%',
      '--primary': '330 70% 56%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '330 45% 92%',
      '--muted': '340 30% 96%',
      '--card': '0 0% 100%',
      '--accent': '40 80% 50%',
      '--border': '330 30% 85%',
      '--ring': '330 70% 56%'
    },
  },
  {
    key: 'sage',
    name: 'Sage Eucalyptus',
    colors: {
      '--brand-accent': 'hsl(170 35% 45%)',
      '--background': '60 20% 98%',
      '--foreground': '155 15% 18%',
      '--primary': '155 30% 38%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '150 20% 94%',
      '--muted': '150 20% 94%',
      '--card': '0 0% 100%',
      '--accent': '170 35% 45%',
      '--border': '150 15% 86%',
      '--ring': '155 30% 38%'
    },
  },
  {
    key: 'noir-rose',
    name: 'Noir Rose Gold',
    colors: {
      '--brand-accent': 'hsl(20 70% 60%)',
      '--background': '240 10% 6%',
      '--foreground': '0 0% 98%',
      '--primary': '330 50% 60%',
      '--primary-foreground': '240 10% 10%',
      '--secondary': '240 6% 12%',
      '--muted': '240 6% 12%',
      '--card': '240 8% 7%',
      '--accent': '20 70% 60%',
      '--border': '240 6% 18%',
      '--ring': '330 50% 60%'
    },
  },
];

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

function applyBrandVariables(brand: BrandConfig) {
  const root = document.documentElement;
  root.setAttribute('data-brand', brand.key);
  root.setAttribute('data-theme', brand.key);
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
    return fromQuery || localStorage.getItem('brand') || 'blush';
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
