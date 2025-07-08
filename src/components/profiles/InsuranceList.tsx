// components/profile/InsuranceList.tsx
import React from 'react';

export const InsuranceList = ({ insurances }: { insurances: any[] }) => {
  return (
    <div className="p-4 border-t space-y-2">
      <h2 className="text-lg font-medium">Insurance Packages</h2>
      {insurances.map((ins, index) => (
        <div key={index} className="border p-2 rounded">
          <p>Package: {ins.name}</p>
          <p>Valid Until: {ins.validUntil}</p>
        </div>
      ))}
    </div>
  );
};
