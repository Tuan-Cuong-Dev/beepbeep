'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { RentalCompany_new, BUSINESS_TYPE_LABELS } from '@/src/lib/rentalCompanies/rentalCompaniesTypes_new';

export default function MyOrganizationInfo() {
  const { currentUser } = useAuth();
  const [company, setCompany] = useState<RentalCompany_new | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!currentUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'rentalCompanies', currentUser.companyId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setCompany(snap.data() as RentalCompany_new);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [currentUser]);

  if (loading) return <p className="text-sm text-gray-500">Loading company info...</p>;

  if (!company) {
    return (
      <p className="text-sm text-gray-500">
        You are not currently associated with any rental company or business.
      </p>
    );
  }

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <div className="flex items-start gap-4">
        {company.logoUrl && (
          <img
            src={company.logoUrl}
            alt={`${company.name} Logo`}
            className="w-16 h-16 object-cover rounded-lg border"
          />
        )}
        <div>
          <h3 className="text-base font-semibold text-gray-800">{company.name}</h3>
          <p className="text-sm text-gray-500 capitalize mt-1">
            {BUSINESS_TYPE_LABELS[company.businessType]}
          </p>
          <p className="text-sm text-gray-600 mt-2">{company.displayAddress}</p>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>Email: {company.email}</p>
            <p>Phone: {company.phone}</p>
            {company.website && (
              <p>
                Website:{' '}
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d289] hover:underline"
                >
                  {company.website}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {company.description && (
        <p className="text-sm text-gray-700 mt-4">{company.description}</p>
      )}
    </div>
  );
}
