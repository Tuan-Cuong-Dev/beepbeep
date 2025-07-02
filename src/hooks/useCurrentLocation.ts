'use client';

import { useEffect, useState } from 'react';

export function useCurrentLocation() {
  const [location, setLocation] = useState<[number, number] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return { location, error, loading };
}
