// components/profile/MyVehiclesSection.tsx
'use client';

import { VehicleCard } from './VehicleCard';

interface Vehicle {
  model: string;
  plateNumber?: string;
  frameNumber?: string;
  imageUrl?: string;
}

interface MyVehiclesSectionProps {
  vehicles: Vehicle[];
}

export default function MyVehiclesSection({ vehicles }: MyVehiclesSectionProps) {
  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">My Vehicles</h2>
      {vehicles.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't added any vehicles yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((vehicle, index) => (
            <VehicleCard key={index} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}