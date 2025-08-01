'use client';

import BatteryTable from './BatteryTableDesktop';
import BatteryTableMobile from './BatteryTableMobile';
import { Battery } from '@/src/lib/batteries/batteryTypes';

interface Props {
  batteries: Battery[];
  setBatteries?: (batteries: Battery[]) => void;
  onEdit?: (battery: Battery) => void;
  onDelete?: (id: string) => void;
}

export default function ResponsiveBatteryTable(props: Props) {
  return (
    <>
      <div className="hidden md:block">
        <BatteryTable {...props} />
      </div>
      <div className="block md:hidden">
        <BatteryTableMobile {...props} />
      </div>
    </>
  );
}
