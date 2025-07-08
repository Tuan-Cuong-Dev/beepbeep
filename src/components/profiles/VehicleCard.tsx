// components/profile/VehicleCard.tsx
import React from 'react';

export const VehicleCard = ({ vehicle }: { vehicle: any }) => {
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="font-semibold">{vehicle.model || 'Unknown Model'}</h3>
      <p>Plate: {vehicle.plateNumber}</p>
      <p>Frame: {vehicle.frameNumber}</p>
    </div>
  );
};