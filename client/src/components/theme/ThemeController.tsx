import { useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

export const ThemeController = () => {
  const { settings } = useUserSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (!settings) return;

    // Theme: light | dark | system
    const applyTheme = () => {
      const theme = settings.appearance.theme || 'system';
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (theme === 'dark' || (theme === 'system' && prefersDark)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    let mql: MediaQueryList | null = null;
    if (settings.appearance.theme === 'system' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mql.addEventListener?.('change', handler);
      // Cleanup
      return () => mql?.removeEventListener?.('change', handler);
    }
  }, [settings?.appearance.theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (!settings) return;

    // Font size: small | medium | large
    const size = settings.appearance.font_size || 'medium';
    root.setAttribute('data-font-size', size);

    // Animations toggle
    root.setAttribute('data-animations', settings.appearance.animations_enabled ? 'on' : 'off');

    // Glassmorphism toggle
    root.setAttribute('data-glass', settings.appearance.glassmorphism_enabled ? 'on' : 'off');

    // High contrast toggle
    root.setAttribute('data-contrast', settings.appearance.high_contrast ? 'high' : 'normal');
  }, [
    settings?.appearance.font_size,
    settings?.appearance.animations_enabled,
    settings?.appearance.glassmorphism_enabled,
    settings?.appearance.high_contrast,
  ]);

  return null;
};