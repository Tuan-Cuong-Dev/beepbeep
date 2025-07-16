// lib/rentalCompanies/useCompanyNameMap.ts
import { useEffect, useState } from 'react';
import { getCompanyName } from '../components/rental-management/rental-companies/getCompanyName';

export function useCompanyNameMap(companyIds: string[]) {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unique = Array.from(new Set(companyIds));
    const fetchNames = async () => {
      const entries = await Promise.all(
        unique.map(async (id) => [id, await getCompanyName(id)])
      );
      setMap(Object.fromEntries(entries));
    };

    if (unique.length > 0) fetchNames();
  }, [companyIds.join(',')]); // depend on content

  return map;
}
