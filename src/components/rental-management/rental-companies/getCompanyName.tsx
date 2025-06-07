// lib/rentalCompanies/getCompanyName.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export async function getCompanyName(rentalCompaniesId: string): Promise<string> {
  try {
    const ref = doc(db, 'rentalCompanies', rentalCompaniesId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data()?.name || '(Unnamed Company)') : '(Unknown)';
  } catch {
    return '(Error loading name)';
  }
}
