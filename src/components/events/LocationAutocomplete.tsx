import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

interface LocationAutocompleteProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

// Lightweight Google Places Autocomplete wrapper with graceful fallback
export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  id,
  value,
  onChange,
  className,
  placeholder = 'Search address or place... ',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    // If no key provided, keep basic input
    if (!GOOGLE_MAPS_API_KEY) return;

    const initAutocomplete = () => {
      try {
        // @ts-ignore - google is provided by the Places script
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
          fields: ['formatted_address', 'name', 'geometry', 'address_components']
        });
        autocomplete.addListener('place_changed', () => {
          // @ts-ignore
          const place = autocomplete.getPlace();
          const label = place?.formatted_address || place?.name || '';
          if (label) onChange(label);
        });
        setEnhanced(true);
      } catch { }
    };

    // If script already loaded
    // @ts-ignore
    if (typeof window !== 'undefined' && window.google && google.maps?.places) {
      initAutocomplete();
      return;
    }

    // Inject script once
    const scriptId = 'google-places-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);
  }, [onChange]);

  return (
    <Input
      id={id}
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(enhanced ? 'pr-10' : '', className)}
      autoComplete="off"
      {...props}
    />
  );
};

export default LocationAutocomplete;
