// 📁 app/battery-stations/page.tsx

import dynamic from 'next/dynamic';

// ⚠️ Quan trọng: import dynamic với ssr: false
const BatteryStationsClientPage = dynamic(
  () => import('./BatteryStationsPage'),
  { ssr: false }
);

export default function BatteryStationsPage() {
  return <BatteryStationsClientPage />;
}
