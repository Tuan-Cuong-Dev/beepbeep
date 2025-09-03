// 📁 lib/organizations/getUserOrganizations.ts
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
  ownerId: string;
}

// ✅ Đồng bộ 10/11 loại lấy trực tiếp theo collection (trừ technicianPartner riêng)
const businessCollections: { collection: string; type: OrganizationType }[] = [
  { collection: 'rentalCompanies',       type: 'rental_company' },
  { collection: 'privateProviders',      type: 'private_provider' },
  { collection: 'agents',                type: 'agent' },
  { collection: 'cityDrivers',           type: 'city_driver' },        // ✅ mới
  { collection: 'intercityDrivers',      type: 'intercity_driver' },   // ✅ mới
  { collection: 'deliveryPartners',      type: 'delivery_partner' },   // ✅ mới
  { collection: 'intercityBusCompanies', type: 'intercity_bus' },
  { collection: 'vehicleTransporters',   type: 'vehicle_transport' },
  { collection: 'tourGuides',            type: 'tour_guide' },
  // technicianPartners xử lý riêng bên dưới để lấy subtype
];

export async function getUserOrganizations(uid: string): Promise<OrgCardData[]> {
  const results: OrgCardData[] = [];

  // 🏎️ Chạy song song tất cả query (trừ technician)
  const queries = businessCollections.map(({ collection: colName, type }) =>
    getDocs(query(collection(db, colName), where('ownerId', '==', uid))).then((snap) => {
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        results.push({
          id: docSnap.id,
          name: d.name || 'Untitled',
          type,
          displayAddress: d.displayAddress || '',
          userRoleInOrg: 'owner',
          logoUrl: d.logoUrl || undefined,
          ownerId: d.ownerId,
        });
      });
    })
  );

  // 🛠️ Technician partner (cần subtype)
  const technicianQuery = getDocs(
    query(collection(db, 'technicianPartners'), where('ownerId', '==', uid))
  ).then((snap) => {
    snap.forEach((docSnap) => {
      const d = docSnap.data() as any;
      const subtypeRaw = (d.subtype || d.type || '').toString().toLowerCase();
      const subtype = subtypeRaw === 'shop' ? 'shop' : subtypeRaw === 'mobile' ? 'mobile' : undefined;

      if (subtype) {
        results.push({
          id: docSnap.id,
          name: d.name || 'Untitled',
          type: 'technician_partner',
          subtype,
          displayAddress: d.displayAddress || '',
          userRoleInOrg: 'owner',
          logoUrl: d.logoUrl || undefined,
          ownerId: d.ownerId,
        });
      }
    });
  });

  await Promise.all([...queries, technicianQuery]);

  // (tuỳ chọn) Sắp xếp cho đẹp mắt — theo tên
  results.sort((a, b) => a.name.localeCompare(b.name));

  return results;
}
