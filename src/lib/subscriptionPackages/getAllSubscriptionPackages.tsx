'use client';

import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { SubscriptionPackage } from './subscriptionPackagesType';

/**
 * Fetch all subscription packages from Firestore
 * @returns Promise<SubscriptionPackage[]>
 */
export async function getAllSubscriptionPackages(): Promise<SubscriptionPackage[]> {
  try {
    const snapshot = await getDocs(collection(db, 'subscriptionPackages'));

    const packages: SubscriptionPackage[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        companyId: data.companyId,
        name: data.name,
        durationType: data.durationType,
        kmLimit: data.kmLimit ?? null,
        chargingMethod: data.chargingMethod,
        basePrice: data.basePrice ?? 0,
        overageRate: data.overageRate ?? null,
        note: data.note ?? '',
        status: data.status ?? 'available', // ✅ Thêm dòng này để lấy trạng thái
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });

    return packages;
  } catch (error) {
    console.error('❌ Failed to fetch subscription packages:', error);
    return [];
  }
}
