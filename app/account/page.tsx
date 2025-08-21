'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/src/i18n';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Timestamp, collection, getDocs, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/src/firebaseConfig';
import { db } from '@/src/firebaseConfig';
import { format } from 'date-fns';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';

import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useUserPreferences } from '@/src/hooks/useUserPreferences';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';
import { UserLocation } from '@/src/lib/users/userTypes';

// ✅ Lấy vị trí trình duyệt
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

// ======================= Config =======================
const TP_COLLECTION = 'technicianPartners'; // đổi nếu DB đang dùng tên khác

export default function AccountPage() {
  const { t } = useTranslation('common');
  const { user, loading, update } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences(user?.uid ?? '');
  const { location, updateLocation } = useUserLocation(user?.uid ?? '');

  const { location: currentLoc, error: locError, loading: locLoading } = useCurrentLocation();

  const [localUser, setLocalUser] = useState(user);
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [localLoc, setLocalLoc] = useState<UserLocation | null>(null);

  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState('');

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyType, setNotifyType] = useState<NotificationType>('success');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyDescription, setNotifyDescription] = useState('');

  const [manualRefreshing, setManualRefreshing] = useState(false);

  // tiện: có role ngay từ user profile
  const role = localUser?.role as string | undefined;

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Đồng bộ vị trí từ Firestore (profile.locations collection của bạn)
  useEffect(() => {
    setLocalLoc(location ?? null);
  }, [location]);

  // Khi trình duyệt cho phép vị trí → cập nhật UI + (nếu cần) đẩy vào technicianPartners
  useEffect(() => {
    if (!currentLoc) return;
    const [lat, lng] = currentLoc;

    // cập nhật form
    setLocalLoc(prev => ({
      lat,
      lng,
      address: prev?.address ?? '',
      updatedAt: Timestamp.now(),
    }));

    // nếu là technician_partner → đẩy vào bảng technicianPartners
    if (role === 'technician_partner') {
      // không chờ bấm Lưu — cập nhật luôn
      void upsertTechnicianPartnerCoordinates({
        userId: user?.uid,
        lat,
        lng,
        mapAddress: undefined, // hoặc dùng localLoc?.address nếu bạn muốn
      });
    }
  }, [currentLoc, role, user?.uid]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localUser?.dateOfBirth) {
      const parsed = new Date(localUser.dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        setFormattedDateOfBirth(format(parsed, 'yyyy-MM-dd'));
      }
    }
  }, [localUser?.dateOfBirth]);

  const handleFieldChange = (field: string, value: string) => {
    setLocalUser((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showNotification = (
    type: NotificationType,
    title: string,
    description?: string
  ) => {
    setNotifyType(type);
    setNotifyTitle(title);
    setNotifyDescription(description ?? '');
    setNotifyOpen(true);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      showNotification('info', t('account.reset_success'), t('account.reset_notice'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', t('account.reset_failed'), msg);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.uid || !localUser) return;

    try {
      // referralCode từ idNumber nếu có
      const referralCode = localUser.idNumber?.trim().toUpperCase();

      const cleanedUserData = {
        ...localUser,
        referralCode,
      };

      // Lọc undefined/null
      const userDataToSave = Object.fromEntries(
        Object.entries(cleanedUserData).filter(
          ([, value]) => value !== undefined && value !== null
        )
      );

      await update(userDataToSave);
      await updatePreferences(localPrefs);

      if (localLoc?.lat !== undefined && localLoc?.lng !== undefined) {
        await updateLocation({
          lat: localLoc.lat,
          lng: localLoc.lng,
          address: localLoc.address || '',
          updatedAt: localLoc.updatedAt ?? Timestamp.now(),
        });

        // Nếu là technician_partner → cố gắng ghi thêm vào technicianPartners (1 lần nữa khi user bấm Lưu)
        if (role === 'technician_partner') {
          await upsertTechnicianPartnerCoordinates({
            userId: user.uid,
            lat: localLoc.lat,
            lng: localLoc.lng,
            mapAddress: localLoc.address || undefined,
          });
        }
      }

      showNotification('success', t('account.update_success'), t('account.saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', t('account.update_failed'), msg);
    }
  };

  // Nút “Lấy lại vị trí hiện tại”
  const refreshCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('error', t('common.error'), 'Geolocation is not supported by your browser.');
      return;
    }
    setManualRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocalLoc(prev => ({
          lat: latitude,
          lng: longitude,
          address: prev?.address ?? '',
          updatedAt: Timestamp.now(),
        }));

        // Ghi ngay vào technicianPartners nếu cần
        if (role === 'technician_partner') {
          await upsertTechnicianPartnerCoordinates({
            userId: user?.uid,
            lat: latitude,
            lng: longitude,
            mapAddress: undefined,
          });
        }
        setManualRefreshing(false);
      },
      (err) => {
        showNotification('error', t('common.error'), err.message || 'Unable to retrieve your location.');
        setManualRefreshing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading || !user || !localUser) {
    return <div className="p-6">{t('landing.loading')}</div>;
  }

  const latText =
    locLoading || manualRefreshing
      ? t('account.fetching_location')
      : (localLoc?.lat !== undefined ? String(localLoc.lat) : '');

  const lngText =
    locLoading || manualRefreshing
      ? t('account.fetching_location')
      : (localLoc?.lng !== undefined ? String(localLoc.lng) : '');

  return (
    <>
      <Header />
      <UserTopMenu />
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">
          {t('user_sidebar.menu.account_info')}
        </h2>

        <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-6 rounded shadow-lg bg-white">
          {/* First Name */}
          <div>
            <Label>{t('account.first_name')}</Label>
            <Input value={localUser.firstName ?? ''} onChange={(e) => handleFieldChange('firstName', e.target.value)} />
          </div>

          {/* Last Name */}
          <div>
            <Label>{t('account.last_name')}</Label>
            <Input value={localUser.lastName ?? ''} onChange={(e) => handleFieldChange('lastName', e.target.value)} />
          </div>

          {/* Full Name */}
          <div className="md:col-span-2">
            <Label>{t('account.full_name')}</Label>
            <Input value={localUser.name ?? ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
          </div>

          {/* Gender */}
          <div>
            <Label>{t('account.gender')}</Label>
            <SimpleSelect
              value={localUser.gender ?? ''}
              onChange={(val) => handleFieldChange('gender', val)}
              options={[
                { label: t('account.male'), value: 'male' },
                { label: t('account.female'), value: 'female' },
                { label: t('account.other'), value: 'other' },
              ]}
              placeholder={t('account.gender')}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <Label>{t('account.date_of_birth')}</Label>
            <Input
              type="date"
              value={formattedDateOfBirth}
              onChange={(e) => {
                setFormattedDateOfBirth(e.target.value);
                handleFieldChange('dateOfBirth', e.target.value);
              }}
            />
          </div>

          {/* ID Number */}
          <div className="md:col-span-1">
            <Label>{t('account.id_number')}</Label>
            <Input
              value={localUser.idNumber ?? ''}
              onChange={(e) => handleFieldChange('idNumber', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('account.referral_hint')}
            </p>
          </div>

          {/* Phone */}
          <div>
            <Label>{t('account.phone')}</Label>
            <Input value={localUser.phone ?? ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
          </div>

          {/* Email */}
          <div className="md:col-span-1">
            <Label>{t('account.email')}</Label>
            <Input value={localUser.email ?? ''} readOnly />
            <p className="text-sm text-gray-500 mt-1">{t('account.login_email_note')}</p>
          </div>

          {/* Password */}
          <div className="md:col-span-1">
            <Label>{t('account.password')}</Label>
            <Input type="password" value="********" disabled />
            <button type="button" onClick={handleResetPassword} className="text-sm text-[#00d289] mt-2 hover:underline">
              {t('account.reset_password')}
            </button>
          </div>

          {/* Preferences - Language */}
          <div>
            <Label>{t('account.language')}</Label>
            <SimpleSelect
              value={localPrefs.language ?? ''}
              onChange={(val) => {
                i18n.changeLanguage(val);
                setLocalPrefs((prev) => ({ ...prev, language: val }));
              }}
              options={[
                { label: 'Vietnamese', value: 'vi' },
                { label: 'English (UK)', value: 'en' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Korean', value: 'ko' },
                { label: 'Russian', value: 'ru' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Italian', value: 'it' },
                { label: 'Spanish', value: 'es' },
                { label: 'Portuguese', value: 'pt' },
                { label: 'Arabic', value: 'ar' },
              ]}
            />
          </div>

          {/* Preferences - Region */}
          <div>
            <Label>{t('account.region')}</Label>
            <SimpleSelect
              value={localPrefs.region ?? ''}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, region: val }))}
              options={[
                { label: 'Vietnam', value: 'VN' },
                { label: 'United Kingdom', value: 'GB' },
                { label: 'Japan', value: 'JP' },
                { label: 'China', value: 'CN' },
                { label: 'South Korea', value: 'KR' },
                { label: 'Russia', value: 'RU' },
                { label: 'France', value: 'FR' },
                { label: 'Germany', value: 'DE' },
                { label: 'Italy', value: 'IT' },
                { label: 'Spain', value: 'ES' },
                { label: 'Portugal', value: 'PT' },
                { label: 'Saudi Arabia', value: 'SA' },
              ]}
            />
          </div>

          {/* Preferences - Currency */}
          <div>
            <Label>{t('account.currency')}</Label>
            <SimpleSelect
              value={localPrefs.currency ?? ''}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, currency: val }))}
              options={[
                { label: 'VND - Vietnamese Dong', value: 'VND' },
                { label: 'GBP - British Pound Sterling', value: 'GBP' },
                { label: 'JPY - Japanese Yen', value: 'JPY' },
                { label: 'CNY - Chinese Yuan', value: 'CNY' },
                { label: 'KRW - South Korean Won', value: 'KRW' },
                { label: 'RUB - Russian Ruble', value: 'RUB' },
                { label: 'EUR - Euro', value: 'EUR' },
                { label: 'SAR - Saudi Riyal', value: 'SAR' },
              ]}
            />
          </div>

          {/* Address Info */}
          <div className="md:col-span-2">
            <Label>{t('account.address')}</Label>
            <Input value={localUser.address ?? ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.city')}</Label>
            <Input value={localUser.city ?? ''} onChange={(e) => handleFieldChange('city', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.state')}</Label>
            <Input value={localUser.state ?? ''} onChange={(e) => handleFieldChange('state', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.zip')}</Label>
            <Input value={localUser.zip ?? ''} onChange={(e) => handleFieldChange('zip', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.country')}</Label>
            <Input value={localUser.country ?? ''} onChange={(e) => handleFieldChange('country', e.target.value)} />
          </div>

          {/* LOCATION */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>{t('account.last_known_address')}</Label>
              <Button
                type="button"
                onClick={refreshCurrentLocation}
                disabled={locLoading || manualRefreshing}
                className="h-8"
                variant="secondary"
              >
                {manualRefreshing ? t('account.fetching_location') : t('account.refresh_location')}
              </Button>
            </div>
            <Input
              className="mt-2"
              value={localLoc?.address ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { lat: 0, lng: 0, updatedAt: Timestamp.now() }),
                  address: e.target.value,
                }))
              }
              placeholder={t('account.address_placeholder')}
            />
            {locError && (
              <p className="text-sm text-red-500 mt-2">
                {locError}
              </p>
            )}
          </div>

          <div>
            <Label>{t('account.latitude')}</Label>
            <Input value={latText} readOnly />
          </div>

          <div>
            <Label>{t('account.longitude')}</Label>
            <Input value={lngText} readOnly />
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex gap-4 mt-6">
            <Button type="button" onClick={handleSaveAll}>
              {t('account.save')}
            </Button>
            <Button type="button" variant="ghost">
              {t('account.cancel')}
            </Button>
          </div>
        </form>
      </main>

      <NotificationDialog
        open={notifyOpen}
        type={notifyType}
        title={notifyTitle}
        description={notifyDescription}
        onClose={() => setNotifyOpen(false)}
      />

      <Footer />
    </>
  );
}

/**
 * ✅ Cập nhật vị trí cho technicianPartners nếu:
 * - Có record technicianPartner ứng với userId
 * - role === 'technician_partner'
 * - type === 'mobile'
 *
 * Ghi fields:
 * - coordinates: { lat, lng }
 * - mapAddress: optional
 * - updatedAt: serverTimestamp()
 */
async function upsertTechnicianPartnerCoordinates(params: {
  userId?: string;
  lat: number;
  lng: number;
  mapAddress?: string;
}) {
  const { userId, lat, lng, mapAddress } = params;
  if (!userId) return;

  try {
    const q = query(
      collection(db, TP_COLLECTION),
      where('userId', '==', userId),
      where('role', '==', 'technician_partner'),
      where('type', '==', 'mobile')
    );

    const snap = await getDocs(q);
    if (snap.empty) return;

    // thường 1 user ↔ 1 doc; nếu nhiều, cập nhật tất cả doc match
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, {
          coordinates: { lat, lng },
          // nếu muốn đồng bộ thêm geo:
          // geo: { lat, lng },
          ...(mapAddress ? { mapAddress } : {}),
          updatedAt: serverTimestamp(),
        })
      )
    );
  } catch (err) {
    // Không chặn UI; bạn có thể log nếu cần
    console.error('Failed to update technician partner coordinates:', err);
  }
}
