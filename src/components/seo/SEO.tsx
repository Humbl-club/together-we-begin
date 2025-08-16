import { useEffect } from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useBrand } from '@/contexts/BrandContext';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string; // path or full URL
  type?: string; // og:type
}

export const SEO: React.FC<SEOProps> = ({ title, description, canonical, type = 'website' }) => {
  const { flags } = useFeatureFlags();
  const { brand } = useBrand();

  useEffect(() => {
    if (!flags.enableSEO) return;

    const fullTitle = `${title} • ${brand.name}`;
    document.title = fullTitle;

    const ensureMeta = (name: string, attr: 'name' | 'property' = 'name') => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      return el;
    };

    if (description) {
      ensureMeta('description').setAttribute('content', description);
      ensureMeta('og:description', 'property').setAttribute('content', description);
      ensureMeta('twitter:description', 'name').setAttribute('content', description);
    }

    ensureMeta('og:title', 'property').setAttribute('content', fullTitle);
    ensureMeta('og:type', 'property').setAttribute('content', type);
    ensureMeta('twitter:card', 'name').setAttribute('content', 'summary_large_image');

    if (canonical) {
      const href = canonical.startsWith('http') ? canonical : `${window.location.origin}${canonical}`;
      let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    }
  }, [title, description, canonical, type, flags.enableSEO, brand.name]);

  return null;
};
