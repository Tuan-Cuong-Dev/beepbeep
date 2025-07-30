import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { OrganizationType } from './organizationTypes';

export interface OrgCardData {
  id: string;
  name: string;
  type: OrganizationType; // e.g., 'technician_partner'
  displayAddress?: string;
  userRoleInOrg: 'owner';
  logoUrl?: string;
  subtype?: 'mobile' | 'shop'; // phân biệt loại hình technician
  ownerId: string; // 👈 THÊM DÒNG NÀY
}

const businessCollections: { collection: string; type: OrganizationType }[] = [
  { collection: 'rentalCompanies', type: 'rental_company' },
  { collection: 'privateProviders', type: 'private_provider' },
  { collection: 'agents', type: 'agent' },
  { collection: 'intercityBusCompanies', type: 'intercity_bus' },
  { collection: 'vehicleTransporters', type: 'vehicle_transport' },
  { collection: 'tourGuides', type: 'tour_guide' },
];

export async function getUserOrganizations(uid: string): Promise<OrgCardData[]> {
  const results: OrgCardData[] = [];

  // 🏢 Load các collection thông thường
  for (const { collection: colName, type } of businessCollections) {
    const q = query(collection(db, colName), where('ownerId', '==', uid));
    const snap = await getDocs(q);

    snap.forEach((doc) => {
      const d = doc.data();
      results.push({
        id: doc.id,
        name: d.name || 'Untitled',
        type,
        displayAddress: d.displayAddress || '',
        userRoleInOrg: 'owner',
        logoUrl: d.logoUrl || undefined,
        ownerId: d.ownerId, // 👈 THÊM DÒNG NÀY
      });
    });
  }

  // 🛠️ Load riêng collection technicianPartners
  const techSnap = await getDocs(
    query(collection(db, 'technicianPartners'), where('ownerId', '==', uid))
  );

  techSnap.forEach((doc) => {
    const d = doc.data();
    const subtype = (d.subtype || d.type || '').toLowerCase();

    // Chỉ chấp nhận mobile/shop
    if (subtype === 'mobile' || subtype === 'shop') {
      results.push({
        id: doc.id,
        name: d.name || 'Untitled',
        type: 'technician_partner',
        subtype,
        displayAddress: d.displayAddress || '',
        userRoleInOrg: 'owner',
        logoUrl: d.logoUrl || undefined,
        ownerId: d.ownerId, // 👈 THÊM DÒNG NÀY
      });
    }
  });

  return results;
}
