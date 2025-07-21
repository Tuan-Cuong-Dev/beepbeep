import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { User as FirestoreUser } from '@/src/lib/users/userTypes';

interface UseAuthResult {
  firebaseUser: FirebaseUser | null;
  currentUser: FirestoreUser | null;
  loading: boolean;
}

/**
 * Custom hook to get both Firebase Auth user and extended Firestore user data.
 */
export function useAuth(): UseAuthResult {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCurrentUser(snap.data() as FirestoreUser);
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { firebaseUser, currentUser, loading };
}
