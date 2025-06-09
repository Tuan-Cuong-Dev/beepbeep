'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData) {
        const staffSnap = await getDocs(
          query(collection(db, 'staffs'), where('userId', '==', currentUser.uid))
        );

        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data();
          setRole(staffData.role || null); // ✅ lấy role từ staffs
          setCompanyId(staffData.companyId || null);
          setStationId(staffData.stationId || null);
        } else {
          setRole(userData.role || null); // fallback nếu không là staff
          setCompanyId(userData.companyId || null);
          setStationId(userData.stationId || null);
        }
      } else {
        setCompanyId(null);
        setStationId(null);
        setRole(null);
      }
    } else {
      setUser(null);
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
