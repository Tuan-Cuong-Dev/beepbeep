// app/battery-stations/page.tsx
import { Suspense } from 'react';
import BatteryStationManagementPage from './BatteryStationManagementPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatteryStationManagementPage />
    </Suspense>
  );
}
