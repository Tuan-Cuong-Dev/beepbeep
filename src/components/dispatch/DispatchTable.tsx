'use client';

import { ExtendedVehicleIssue } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Staff } from '@/src/lib/staff/staffTypes';
import { useUser } from '@/src/context/AuthContext';
import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';

interface Props {
  issues: ExtendedVehicleIssue[];
  technicians: Staff[];
  onAssigned?: (issueId: string) => void;
}

export default function DispatchTable({ issues, technicians, onAssigned }: Props) {
  const { user } = useUser();
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});

  const handleAssign = async (issueId: string) => {
    const technicianId = assignMap[issueId];
    if (!technicianId || !user?.uid) return;

    const issueRef = doc(db, 'vehicleIssues', issueId);
    await updateDoc(issueRef, {
      assignedTo: technicianId,
      assignedBy: user.uid,
      assignedAt: Timestamp.now(),
      status: 'assigned',
    });

    if (onAssigned) onAssigned(issueId);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Issue</th>
            <th className="p-2 text-left">Location</th>
            <th className="p-2 text-left">Vehicle Info</th>
            <th className="p-2 text-left">Customer</th>
            <th className="p-2 text-left">Created At</th>
            <th className="p-2 text-left">Assign To</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-b">
              <td className="p-2">{issue.description?.slice(0, 30)}</td>
              <td className="p-2">{issue.stationName || issue.customerLocation || '-'}</td>
              <td className="p-2">
                {issue.plateNumber || issue.vin || issue.vehicleLicensePlate || '-'}<br />
                {issue.vehicleBrand && issue.vehicleModel ? `${issue.vehicleBrand} ${issue.vehicleModel}` : ''}
              </td>
              <td className="p-2">
                {issue.customerName ? `${issue.customerName}` : '-'}<br />
                {issue.customerPhone ? `${issue.customerPhone}` : ''}
              </td>
              <td className="p-2">{issue.reportedAt?.toDate().toLocaleString() || '-'}</td>
              <td className="p-2">
                <SimpleSelect
                  value={assignMap[issue.id] || ''}
                  onChange={(val) => setAssignMap({ ...assignMap, [issue.id]: val })}
                  options={technicians.map((t) => ({ label: t.name, value: t.userId }))}
                />
              </td>
              <td className="p-2">
                <Button onClick={() => handleAssign(issue.id)}>Assign</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
