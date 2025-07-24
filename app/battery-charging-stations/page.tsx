// app/battery-charging-stations/page.tsx
import dynamic from 'next/dynamic';

const BatteryChargingStationsClientPage = dynamic(
  () => import('@/src/components/battery-charging-stations/BatteryChargingStationsClientPage'),
  { ssr: false }
);

export default function Page() {
  return <BatteryChargingStationsClientPage />;
}
