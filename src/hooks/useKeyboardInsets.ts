import { useEffect, useState } from 'react';

// Returns extra bottom padding (in pixels) needed to keep content above the soft keyboard
export function useKeyboardInsets(): number {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return; // Not supported

    const handler = () => {
      const heightDiff = window.innerHeight - vv.height;
      const offset = Math.max(0, heightDiff + vv.offsetTop);
      setBottom(offset);
    };

    handler();
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  return bottom;
}
