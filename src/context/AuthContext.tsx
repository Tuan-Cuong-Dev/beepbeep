'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebaseConfig';
import i18n from '@/src/i18n';

import { User as AppUser, UserPreferences } from '@/src/lib/users/userTypes';

interface AuthContextType {
  user: AppUser | null;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [stationId, setStationId] = useState('');
  const [role, setRole] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    region: 'US',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        // staff link (nếu có)
        const staffSnap = await getDocs(
          query(collection(db, 'staffs'), where('userId', '==', currentUser.uid))
        );
        const staffData = !staffSnap.empty ? staffSnap.docs[0].data() : null;

        // preferences
        const prefs = userData?.preferences || {};
        const loadedPrefs: UserPreferences = {
          language: prefs.language || 'en',
          region: prefs.region || 'US',
          currency: prefs.currency || 'USD',
        };
        setPreferences(loadedPrefs);

        // i18n
        if (i18n.isInitialized && i18n.language !== loadedPrefs.language) {
          i18n.changeLanguage(loadedPrefs.language);
        } else {
          setTimeout(() => i18n.changeLanguage(loadedPrefs.language), 100);
        }

        // role & org linking
        setRole(staffData?.role || userData?.role || '');
        setCompanyId(staffData?.companyId || userData?.companyId || '');
        setStationId(staffData?.stationId || userData?.stationId || '');

        if (userData) {
          // Map theo schema mới: KHÔNG còn address/address2/city/state/zip/country ở root
          setUser({
            uid: currentUser.uid,
            name: userData.name || '',
            email: userData.email || currentUser.email || '',
            phone: userData.phone || currentUser.phoneNumber || '',
            photoURL: userData.photoURL || currentUser.photoURL || '',
            companyId: userData.companyId,
            role: userData.role || '',

            // ✅ địa chỉ hồ sơ (tĩnh) dạng chuẩn
            profileAddress: userData.profileAddress,

            homeAirport: userData.homeAirport,

            preferences: loadedPrefs,

            // mở rộng
            idNumber: userData.idNumber,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth,
            coverURL: userData.coverURL,

            // 🚨 vị trí động
            lastKnownLocation: userData.lastKnownLocation,

            // điểm/giới thiệu
            contributionPoints: userData.contributionPoints || 0,
            contributionLevel: userData.contributionLevel || 1,
            totalContributions: userData.totalContributions || 0,

            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            referralPoints: userData.referralPoints || 0,
            totalReferrals: userData.totalReferrals || 0,

            // thời gian
            createdAt: userData.createdAt?.toDate?.() || new Date(),
            updatedAt: userData.updatedAt?.toDate?.() || new Date(),
          });
        } else {
          setUser(null);
        }
      } else {
        // signed out
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
