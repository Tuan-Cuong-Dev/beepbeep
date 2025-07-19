import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { UserPreferences } from '@/src/lib/users/userTypes'; // nếu bạn có tách type riêng

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'vi',
  region: 'VN',
  currency: 'VND',
};

export const usePreferences = (userId?: string | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔁 Lấy preferences khi userId thay đổi
  useEffect(() => {
    if (!userId) return;

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setPreferences({
            language: data.preferences?.language || DEFAULT_PREFERENCES.language,
            region: data.preferences?.region || DEFAULT_PREFERENCES.region,
            currency: data.preferences?.currency || DEFAULT_PREFERENCES.currency,
          });
        } else {
          // 🧩 Nếu chưa có doc user → có thể tạo mới luôn nếu muốn
          await setDoc(ref, { preferences: DEFAULT_PREFERENCES }, { merge: true });
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  // ✅ Cập nhật preferences
  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!userId) return;

    const ref = doc(db, 'users', userId);
    const current = preferences || DEFAULT_PREFERENCES;
    const updated = { ...current, ...newPrefs };

    await updateDoc(ref, {
      preferences: updated,
    });

    setPreferences(updated);
  };

  return {
    preferences,
    updatePreferences,
    loading,
  };
};
