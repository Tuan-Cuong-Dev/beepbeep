// Dùng để refesh dữ liệu tọa độ khi thêm link vào mapaddress

import { useState } from 'react';

export function useGeocodeAddress() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const extractLatLngFromGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match && match.length === 3) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const geocode = async (address: string) => {
    setLoading(true);
    setError(null);
    setCoords(null);

    try {
      const result = extractLatLngFromGoogleMapsUrl(address);
      if (result) {
        setCoords(result);
      } else {
        setError('❌ Could not extract coordinates. Make sure the link contains "@lat,lng".');
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
      setError('❌ Failed to extract location.');
    } finally {
      setLoading(false);
    }
  };

  return {
    geocode,
    coords,
    error,
    loading,
  };
}
