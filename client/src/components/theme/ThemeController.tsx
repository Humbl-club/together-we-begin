import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export const ThemeController = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Apply default theme while auth is loading or user is not logged in
    const root = document.documentElement;
    
    if (loading) {
      // Default theme during loading
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      return;
    }

    if (!user) {
      // Default theme for non-logged in users
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      // Set default attributes
      root.setAttribute('data-font-size', 'medium');
      root.setAttribute('data-animations', 'on');
      root.setAttribute('data-glass', 'on');
      root.setAttribute('data-contrast', 'normal');
      return;
    }
    
    // For logged in users, we'll let the user settings handle themes
    // This is a simplified version that doesn't depend on useUserSettings
  }, [user, loading]);


  return null;
};