// components/profile/LocationMap.tsx
import React from 'react';

export const LocationMap = ({ location }: { location?: { lat: number; lng: number } }) => {
  if (!location) return null;
  const mapSrc = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  return (
    <div className="p-4 border-b">
      <h2 className="text-lg font-medium mb-2">Last Known Location</h2>
      <iframe src={mapSrc} className="w-full h-64 rounded border" loading="lazy" />
    </div>
  );
};