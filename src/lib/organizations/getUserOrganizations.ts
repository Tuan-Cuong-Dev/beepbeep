import {
  getDocs,
  query,
  collection,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export type OrganizationType =
  | 'rental_company'
  | 'technician_partner'
  | 'agent'
  | 'private_owner'
  | 'tour_guide'
  | 'intercity_bus'
  | 'vehicle_transport';

export interface OrgCardData {
  id: string;
  type: OrganizationType;
  subtype?: string;
  ownerId: string;
  name: string;
  logoUrl?: string;
  displayAddress?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
  userRoleInOrg: 'owner';
}

export async function getUserOrganizations(uid: string): Promise<OrgCardData[]> {
  const results: OrgCardData[] = [];

  const fetch = async ({
    col,
    type,
    nameField,
    subtypeField,
  }: {
    col: string;
    type: OrganizationType;
    nameField: string;
    subtypeField?: string;
  }) => {
    const q = query(collection(db, col), where('ownerId', '==', uid));
    const snap = await getDocs(q);

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        type,
        ownerId: d.ownerId,
        name: d[nameField],
        logoUrl: d.logoUrl || d.avatarUrl || '',
        displayAddress: d.displayAddress || d.shopAddress || '',
        email: d.email || '',
        phone: d.phone || '',
        website: d.website || '',
        description: d.description || '',
        subtype: subtypeField ? d[subtypeField] : undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        userRoleInOrg: 'owner',
      });
    });
  };

  await Promise.all([
    fetch({
      col: 'rentalCompanies',
      type: 'rental_company',
      nameField: 'name',
    }),
    fetch({
      col: 'technicianPartners',
      type: 'technician_partner',
      nameField: 'shopName',
      subtypeField: 'type', // 'shop' | 'mobile'
    }),
    fetch({
      col: 'agents',
      type: 'agent',
      nameField: 'name',
    }),
    fetch({
      col: 'privateOwners',
      type: 'private_owner',
      nameField: 'name',
    }),
    fetch({
      col: 'tourGuides',
      type: 'tour_guide',
      nameField: 'name',
    }),
    fetch({
      col: 'intercityBuses',
      type: 'intercity_bus',
      nameField: 'companyName',
    }),
    fetch({
      col: 'vehicleTransporters',
      type: 'vehicle_transport',
      nameField: 'companyName',
    }),
  ]);

  return results;
}
