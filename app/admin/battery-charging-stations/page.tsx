// app/battery-stations/page.tsx
import { Suspense } from 'react';
import BatteryChargingStationManagementPage from './BatteryChargingStationManagementPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatteryChargingStationManagementPage />
    </Suspense>
  );
}
