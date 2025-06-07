'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  companyId: string | null;
  stationId: string | null;
  role: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: null,
  stationId: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const data = userDoc.data();
        setCompanyId(data?.companyId || null);
        setStationId(data?.stationId || null);
        setRole(data?.role || null);
      } else {
        setCompanyId(null);
        setStationId(null);
        setRole(null);
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
