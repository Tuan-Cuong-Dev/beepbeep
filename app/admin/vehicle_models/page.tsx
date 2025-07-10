// app/vehicle_models/page.tsx
import { Suspense } from 'react';
import VehicleModelManagementPage from '@/src/components/vehicleModels_new/VehicleModelManagementPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VehicleModelManagementPage />
    </Suspense>
  );
}
