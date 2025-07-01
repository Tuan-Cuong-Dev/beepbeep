'use client';

import StaffTable from './StaffTable';
import StaffTableMobile from './StaffTableMobile';
import { Staff } from '@/src/lib/staff/staffTypes';

interface Props {
  staffs: Staff[];
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  stationMap?: Record<string, string>;
  companyNames?: Record<string, string>;
}

export default function ResponsiveStaffTable(props: Props) {
  return (
    <>
      <div className="hidden md:block">
        <StaffTable {...props} />
      </div>
      <div className="block md:hidden">
        <StaffTableMobile {...props} />
      </div>
    </>
  );
}
