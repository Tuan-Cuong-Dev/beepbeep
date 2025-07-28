// ✅ getUserOrganizations.ts – Lấy tất cả tổ chức mà user sở hữu, từ nhiều collections

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export interface OrgCardData {
  id: string;
  name: string;
  type: string; // businessType
  displayAddress?: string;
  userRoleInOrg: 'owner';
  logoUrl?: string;
  subtype?: string;
}

const businessCollections: { collection: string; type: string }[] = [
  { collection: 'rentalCompanies', type: 'rental_company' },
  { collection: 'privateProviders', type: 'private_provider' },
  { collection: 'agents', type: 'agent' },
  { collection: 'technicianPartners', type: 'technician_partner' },
  { collection: 'intercityBusCompanies', type: 'intercity_bus' },
  { collection: 'vehicleTransporters', type: 'vehicle_transport' },
  { collection: 'tourGuides', type: 'tour_guide' },
];

export async function getUserOrganizations(uid: string): Promise<OrgCardData[]> {
  const results: OrgCardData[] = [];

  for (const { collection: colName, type } of businessCollections) {
    const q = query(collection(db, colName), where('ownerId', '==', uid));
    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || 'Untitled',
        type: d.businessType || type,
        displayAddress: d.displayAddress || '',
        userRoleInOrg: 'owner',
        logoUrl: d.logoUrl || undefined,
        subtype: d.type || undefined, // e.g. mobile/shop for technician
      } satisfies OrgCardData;
    });

    results.push(...data);
  }

  return results;
}

// 👉 Add this at the top of getUserOrganizations.ts

export type OrganizationType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';
