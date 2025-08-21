'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/src/i18n';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/src/firebaseConfig';
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

// ⬇️ thêm hook lấy vị trí hiện tại
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

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

  // refresh thủ công (không sửa hook)
  const [manualRefreshing, setManualRefreshing] = useState(false);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Đồng bộ vị trí từ Firestore
  useEffect(() => {
    setLocalLoc(location ?? null);
  }, [location]);

  // Khi hook lấy được vị trí trình duyệt → ghi vào localLoc (giữ nguyên address cũ nếu có)
  useEffect(() => {
    if (currentLoc) {
      setLocalLoc(prev => ({
        lat: currentLoc[0],
        lng: currentLoc[1],
        address: prev?.address ?? '',
        updatedAt: Timestamp.now(),
      }));
    }
  }, [currentLoc]);

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

      // Lọc bỏ undefined/null
      const userDataToSave = Object.fromEntries(
        Object.entries(cleanedUserData).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      await update(userDataToSave);
      await updatePreferences(localPrefs);

      if (localLoc?.lat !== undefined && localLoc?.lng !== undefined) {
        await updateLocation({
          lat: localLoc.lat,
          lng: localLoc.lng,
          address: localLoc.address || '',
          updatedAt: Timestamp.now(),
        });
      }

      showNotification('success', t('account.update_success'), t('account.saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', t('account.update_failed'), msg);
    }
  };

  // Nút "Lấy lại vị trí hiện tại" (gọi trực tiếp Geolocation API)
  const refreshCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('error', t('common.error'), 'Geolocation is not supported by your browser.');
      return;
    }
    setManualRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalLoc(prev => ({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: prev?.address ?? '',
          updatedAt: Timestamp.now(),
        }));
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

          {/* ✅ LOCATION: tự động lấy lat/lng, cho sửa address + nút refresh */}
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
