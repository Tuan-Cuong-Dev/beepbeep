'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  companyId: string;
  stationId: string;
  role: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: '',
  stationId: '',
  role: '',
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [stationId, setStationId] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData) {
          const staffSnap = await getDocs(
            query(collection(db, 'staffs'), where('userId', '==', currentUser.uid))
          );

          if (!staffSnap.empty) {
            const staffData = staffSnap.docs[0].data();
            setRole(staffData.role || '');
            setCompanyId(staffData.companyId || '');
            setStationId(staffData.stationId || '');
          } else {
            setRole(userData.role || '');
            setCompanyId(userData.companyId || '');
            setStationId(userData.stationId || '');
          }
        } else {
          setCompanyId('');
          setStationId('');
          setRole('');
        }
      } else {
        setUser(null);
        setCompanyId('');
        setStationId('');
        setRole('');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, companyId, stationId, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => useContext(AuthContext);
export const useAuthContext = () => useContext(AuthContext);
