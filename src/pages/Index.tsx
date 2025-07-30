import React from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import MobileFirstIndex from './MobileFirstIndex';

const Index = () => {
  const { isMobile } = useMobileFirst();

  // Always use the mobile-first index for all devices
  return <MobileFirstIndex />;
};

export default Index;