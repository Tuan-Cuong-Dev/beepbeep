'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  ErrorCode,
  TechnicianReference,
  TechnicianSuggestion,
} from '@/src/lib/errorCodes/errorCodeTypes';

export function useErrorCodes() {
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchErrorCodes = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'errorCodes'));

      const data: ErrorCode[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();

        return {
          id: docSnap.id,
          code: raw.code,
          description: raw.description,
          recommendedSolution: raw.recommendedSolution,
          brand: raw.brand,
          modelName: raw.modelName,
          createdBy: raw.createdBy,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
          tutorialVideoUrl: raw.tutorialVideoUrl,
          technicianSuggestions: raw.technicianSuggestions as TechnicianSuggestion[] || [],
          technicianReferences: raw.technicianReferences as TechnicianReference[] || [],
        };
      });

      setErrorCodes(data);
    } catch (error) {
      console.error('Error fetching error codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteErrorCode = async (id: string) => {
    await deleteDoc(doc(db, 'errorCodes', id));
    await fetchErrorCodes();
  };

  useEffect(() => {
    fetchErrorCodes();
  }, []);

  return { errorCodes, loading, deleteErrorCode, refetch: fetchErrorCodes };
}

