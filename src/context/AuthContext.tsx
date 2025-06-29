'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import i18n from '@/src/i18n'; // ✅ Import từ nơi đã init, KHÔNG import từ 'i18next'

interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  companyId: string;
  stationId: string;
  role: string;
  preferences: UserPreferences;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: '',
  stationId: '',
  role: '',
  preferences: {
    language: 'en',
    region: 'US',
    currency: 'USD',
  },
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [stationId, setStationId] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    region: 'US',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData) {
          // 👉 Gán thông tin staff nếu có
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

          // 👉 Gán preferences
          const prefs = userData.preferences || {};
          const loadedPrefs: UserPreferences = {
            language: prefs.language || 'en',
            region: prefs.region || 'US',
            currency: prefs.currency || 'USD',
          };
          setPreferences(loadedPrefs);

          // 👉 Chỉ đổi ngôn ngữ nếu khác hiện tại
          if (i18n.isInitialized && i18n.language !== loadedPrefs.language) {
            i18n.changeLanguage(loadedPrefs.language);
          } else {
            // Delay một chút để tránh lỗi chưa init
            setTimeout(() => {
              i18n.changeLanguage(loadedPrefs.language);
            }, 100);
          }
        } else {
          // Nếu user không tồn tại trong Firestore
          setCompanyId('');
          setStationId('');
          setRole('');
        }
      } else {
        // Khi người dùng đăng xuất
        setUser(null);
        setCompanyId('');
        setStationId('');
        setRole('');
        setPreferences({
          language: 'en',
          region: 'US',
          currency: 'USD',
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        companyId,
        stationId,
        role,
        preferences,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => useContext(AuthContext);
export const useAuthContext = () => useContext(AuthContext);
