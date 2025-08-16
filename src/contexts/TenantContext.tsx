import React, { createContext, useContext, useMemo, useState } from 'react';

type TenantContextValue = {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string | null>(
    () => localStorage.getItem('tenantId') || null
  );

  const setTenantId = (id: string | null) => {
    setTenantIdState(id);
    if (id) localStorage.setItem('tenantId', id);
    else localStorage.removeItem('tenantId');
  };

  const value = useMemo(() => ({ tenantId, setTenantId }), [tenantId]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
