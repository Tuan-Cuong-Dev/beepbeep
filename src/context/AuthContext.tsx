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

        const staffSnap = await getDocs(
          query(collection(db, 'staffs'), where('userId', '==', currentUser.uid))
        );
        const staffData = !staffSnap.empty ? staffSnap.docs[0].data() : null;

        const prefs = userData?.preferences || {};
        const loadedPrefs: UserPreferences = {
          language: prefs.language || 'en',
          region: prefs.region || 'US',
          currency: prefs.currency || 'USD',
        };
        setPreferences(loadedPrefs);

        // Ngôn ngữ
        if (i18n.isInitialized && i18n.language !== loadedPrefs.language) {
          i18n.changeLanguage(loadedPrefs.language);
        } else {
          setTimeout(() => i18n.changeLanguage(loadedPrefs.language), 100);
        }

        // Phân quyền & liên kết
        setRole(staffData?.role || userData?.role || '');
        setCompanyId(staffData?.companyId || userData?.companyId || '');
        setStationId(staffData?.stationId || userData?.stationId || '');

        if (userData) {
          setUser({
            uid: currentUser.uid,
            name: userData.name || '',
            email: userData.email || currentUser.email || '',
            phone: userData.phone || currentUser.phoneNumber || '',
            photoURL: userData.photoURL || currentUser.photoURL || '',

            role: userData.role || '',

            address: userData.address || '',
            address2: userData.address2,
            city: userData.city,
            state: userData.state,
            zip: userData.zip,
            country: userData.country,
            homeAirport: userData.homeAirport,

            preferences: loadedPrefs,

            idNumber: userData.idNumber,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth,
            coverURL: userData.coverURL,

            lastKnownLocation: userData.lastKnownLocation,

            contributionPoints: userData.contributionPoints || 0,
            contributionLevel: userData.contributionLevel || 1,
            totalContributions: userData.totalContributions || 0,

            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            referralPoints: userData.referralPoints || 0,
            totalReferrals: userData.totalReferrals || 0,

            createdAt: userData.createdAt?.toDate?.() || new Date(),
            updatedAt: userData.updatedAt?.toDate?.() || new Date(),
          });
        } else {
          setUser(null);
        }
      } else {
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
