// 📄 src/hooks/useErrorCodes.ts

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';

export function useErrorCodes() {
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchErrorCodes = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'errorCodes'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorCode));
    setErrorCodes(data);
    setLoading(false);
  };

  const deleteErrorCode = async (id: string) => {
    await deleteDoc(doc(db, 'errorCodes', id));
    await fetchErrorCodes(); // 🔄 fetch lại ngay sau khi xóa
  };

  useEffect(() => {
    fetchErrorCodes();
  }, []);

  return { errorCodes, loading, deleteErrorCode, refetch: fetchErrorCodes };
}

