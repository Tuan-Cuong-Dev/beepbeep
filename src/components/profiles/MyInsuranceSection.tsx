// components/profile/MyInsuranceSection.tsx
'use client';

interface Insurance {
  name: string;
  validUntil: string; // ISO string hoặc ngày định dạng sẵn
}

interface MyInsuranceSectionProps {
  insurances: Insurance[];
}

export default function MyInsuranceSection({ insurances }: MyInsuranceSectionProps) {
  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">My Insurance Packages</h2>
      {insurances.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't purchased any insurance packages yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {insurances.map((pkg, idx) => (
            <div key={idx} className="border p-4 rounded shadow-sm">
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-gray-500">Valid Until: {pkg.validUntil}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}