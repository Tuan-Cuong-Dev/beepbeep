'use client';

import { useEffect, useState } from 'react';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Button } from '@/src/components/ui/button';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { formatCurrency } from '@/src/utils/formatCurrency'; // ✅ nhớ import formatCurrency

interface Props {
  packages: SubscriptionPackage[];
  onEdit: (pkg: SubscriptionPackage) => void;
  onDelete: (id: string) => void;
}

export default function SubscriptionPackageTable({ packages, onEdit, onDelete }: Props) {
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'rentalCompanies'));
        const map: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          map[docSnap.id] = data.name || 'Unknown Company';
        });
        setCompanyMap(map);
      } catch (err) {
        console.error('❌ Error fetching company names:', err);
      }
    };

    fetchCompanyNames();
  }, []);

  const sortedPackages = [...packages].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Subscription Packages List</h2>

      <table className="min-w-full text-sm border border-gray-200">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 border">Company</th>
            <th className="px-3 py-2 border">Name</th>
            <th className="px-3 py-2 border">Duration</th>
            <th className="px-3 py-2 border">KM Limit</th>
            <th className="px-3 py-2 border">Charging</th>
            <th className="px-3 py-2 border">Base Price</th>
            <th className="px-3 py-2 border">Overage Rate</th>
            <th className="px-3 py-2 border">Note</th>
            <th className="px-3 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPackages.map((pkg) => (
            <tr key={pkg.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border text-gray-700 font-semibold">
              {pkg.companyId ? (companyMap[pkg.companyId] || pkg.companyId) : 'Unknown Company'}
              </td>
              <td className="px-3 py-2 border font-medium">{pkg.name}</td>
              <td className="px-3 py-2 border capitalize">{pkg.durationType}</td>
              <td className="px-3 py-2 border text-center">{pkg.kmLimit ?? 'Unlimited'}</td>
              <td className="px-3 py-2 border capitalize">{pkg.chargingMethod}</td>
              <td className="px-3 py-2 border text-right">{formatCurrency(pkg.basePrice)}</td>
              <td className="px-3 py-2 border text-right">
                {pkg.overageRate !== undefined && pkg.overageRate !== null
                  ? `${formatCurrency(pkg.overageRate)}/km`
                  : '-'}
              </td>
              <td className="px-3 py-2 border">{pkg.note ?? '-'}</td>
              <td className="px-3 py-2 border">
                <div className="flex gap-2 justify-center">
                  <Button  size = "sm" onClick={() => onEdit(pkg)}>
                    Edit
                  </Button>
                  <Button size = "sm" variant="destructive"  onClick={() => onDelete(pkg.id!)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {packages.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-6 text-gray-500">
                No subscription packages found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
