import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Customer } from '@/src/lib/customers/customerTypes';

const customersCollection = collection(db, 'customers');

export const getAllCustomers = async (): Promise<Customer[]> => {
  const snapshot = await getDocs(customersCollection);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<Customer, 'id'>),
    id: docSnap.id,
  }));
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const docRef = doc(db, 'customers', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...(docSnap.data() as Omit<Customer, 'id'>), id: docSnap.id };
  }
  return null;
};

export const createCustomer = async (
  data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Customer> => {
  const now = new Date();
  const payload = {
    ...data,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    dateOfBirth:
      data.dateOfBirth instanceof Timestamp
        ? data.dateOfBirth
        : typeof data.dateOfBirth === 'string'
        ? Timestamp.fromDate(new Date(data.dateOfBirth + 'T00:00:00'))
        : null,
  };

  const docRef = await addDoc(customersCollection, payload);

  return {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateCustomer = async (
  id: string,
  data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const now = new Date();
    const docRef = doc(db, 'customers', id);

    const updatePayload: any = {
      ...data,
      updatedAt: Timestamp.fromDate(now),
    };

    if (data.dateOfBirth) {
      updatePayload.dateOfBirth =
        data.dateOfBirth instanceof Timestamp
          ? data.dateOfBirth
          : typeof data.dateOfBirth === 'string'
          ? Timestamp.fromDate(new Date(data.dateOfBirth + 'T00:00:00'))
          : null;
    }

    console.log('📤 Updating doc:', id);
    console.log('🧾 Payload:', updatePayload);

    await updateDoc(docRef, updatePayload);
    console.log('✅ Update successful');
  } catch (error) {
    console.error('❌ Error in updateCustomer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'customers', id));
};

export async function ensureCustomerByUserId(userId: string, customerData: Partial<Customer>): Promise<void> {
  const customerRef = collection(db, 'customers');
  const q = query(customerRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: new Date(),
    });
  } else {
    await addDoc(customerRef, {
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function checkCustomerByPhone(phone: string): Promise<Customer | null> {
  const customerRef = collection(db, 'customers');
  const q = query(customerRef, where('phone', '==', phone));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  }

  return null;
}
