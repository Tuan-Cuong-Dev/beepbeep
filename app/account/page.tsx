'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { User as AppUser } from '@/src/lib/users/userTypes';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

// ===== Helpers =====
const sanitizeReferral = (idNumber?: string) =>
  idNumber ? idNumber.trim().replace(/\s+/g, '').toUpperCase() : undefined;

const toISODateOrEmpty = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
};

// State cục bộ cho UI (không dùng type có GeoPoint)
type EditableUserLocation = {
  lat: number;
  lng: number;
  address?: string;
  updatedAt: Timestamp;
};

export default function AccountPage() {
  const { t } = useTranslation('common');

  // Core data
  const { user, loading, update } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences(user?.uid ?? '');
  // ⚠️ Đổi tên để tránh "đè": hook trả về bản từ DB (có geo)
  const { location: dbLocation, updateLocation } = useUserLocation(user?.uid ?? '');

  // Browser location
  const { location: currentLoc, error: locError, loading: locLoading } = useCurrentLocation();

  // Local editable states
  const [localUser, setLocalUser] = useState<Partial<AppUser> | null>(null);
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [localLoc, setLocalLoc] = useState<EditableUserLocation | null>(null);
  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState('');

  // Notifications
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyType, setNotifyType] = useState<NotificationType>('success');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyDescription, setNotifyDescription] = useState('');

  // Manual refresh state
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // ===== Sync remote → local =====
  useEffect(() => {
    setLocalUser(user ?? null);
  }, [user]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Map DB location (có geo) → editable state
  useEffect(() => {
    if (!dbLocation) {
      setLocalLoc(null);
      return;
    }
    setLocalLoc({
      lat: dbLocation.geo.latitude,
      lng: dbLocation.geo.longitude,
      address: dbLocation.address ?? '',
      updatedAt: dbLocation.updatedAt ?? Timestamp.now(),
    });
  }, [dbLocation]);

  // Khi browser định vị được → cập nhật editable state (giữ address cũ)
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

  // Seed DOB input
  useEffect(() => {
    setFormattedDateOfBirth(toISODateOrEmpty(localUser?.dateOfBirth));
  }, [localUser?.dateOfBirth]);

  // ===== Derived UI states =====
  const isBusy = loading || !user || !localUser;
  const isSavingDisabled = !localUser || !user?.uid;

  const latText = useMemo(() => {
    if (locLoading || manualRefreshing) return t('account.fetching_location');
    return localLoc?.lat !== undefined ? String(localLoc.lat) : '';
  }, [locLoading, manualRefreshing, localLoc?.lat, t]);

  const lngText = useMemo(() => {
    if (locLoading || manualRefreshing) return t('account.fetching_location');
    return localLoc?.lng !== undefined ? String(localLoc.lng) : '';
  }, [locLoading, manualRefreshing, localLoc?.lng, t]);

  // ===== UI helpers =====
  const showNotification = (type: NotificationType, title: string, description?: string) => {
    setNotifyType(type);
    setNotifyTitle(title);
    setNotifyDescription(description ?? '');
    setNotifyOpen(true);
  };

  const handleFieldChange = <K extends keyof AppUser>(field: K, value: AppUser[K]) => {
    setLocalUser(prev => (prev ? { ...prev, [field]: value } : { [field]: value } as Partial<AppUser>));
  };

  // ===== Actions =====
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
      // Build user payload
      const referralCode = sanitizeReferral(localUser.idNumber);
      const cleanedUserData: Partial<AppUser> = { ...localUser, referralCode };

      const userDataToSave = Object.fromEntries(
        Object.entries(cleanedUserData).filter(([, value]) => value !== undefined && value !== null)
      );

      await update(userDataToSave);
      await updatePreferences(localPrefs);

      // Map editable → hook updater (hook sẽ convert sang GeoPoint)
      if (localLoc?.lat !== undefined && localLoc?.lng !== undefined) {
        await updateLocation({
          lat: localLoc.lat,
          lng: localLoc.lng,
          address: localLoc.address || '',
        });
      }

      showNotification('success', t('account.update_success'), t('account.saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', t('account.update_failed'), msg);
    }
  };

  // Manual refresh via Geolocation API
  const refreshCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('error', t('common.error'), 'Geolocation is not supported by your browser.');
      return;
    }
    setManualRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocalLoc(prev => ({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: prev?.address ?? '',
          updatedAt: Timestamp.now(),
        }));
        setManualRefreshing(false);
      },
      err => {
        showNotification('error', t('common.error'), err.message || 'Unable to retrieve your location.');
        setManualRefreshing(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (isBusy) {
    return <div className="p-6">{t('landing.loading')}</div>;
  }

  return (
    <>
      <Header />
      <UserTopMenu />
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">
          {t('user_sidebar.menu.account_info')}
        </h2>

        <form onSubmit={e => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-6 rounded shadow-lg bg-white">
          {/* First Name */}
          <div>
            <Label>{t('account.first_name')}</Label>
            <Input
              value={localUser.firstName ?? ''}
              onChange={e => handleFieldChange('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>{t('account.last_name')}</Label>
            <Input
              value={localUser.lastName ?? ''}
              onChange={e => handleFieldChange('lastName', e.target.value)}
              autoComplete="family-name"
            />
          </div>

          {/* Full Name */}
          <div className="md:col-span-2">
            <Label>{t('account.full_name')}</Label>
            <Input
              value={localUser.name ?? ''}
              onChange={e => handleFieldChange('name', e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Gender */}
          <div>
            <Label>{t('account.gender')}</Label>
            <SimpleSelect
              value={localUser.gender ?? ''}
              onChange={val => handleFieldChange('gender', val as AppUser['gender'])}
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
              onChange={e => {
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
              onChange={e => handleFieldChange('idNumber', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{t('account.referral_hint')}</p>
          </div>

          {/* Phone */}
          <div>
            <Label>{t('account.phone')}</Label>
            <Input
              value={localUser.phone ?? ''}
              onChange={e => handleFieldChange('phone', e.target.value)}
              autoComplete="tel"
            />
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
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-[#00d289] mt-2 hover:underline"
            >
              {t('account.reset_password')}
            </button>
          </div>

          {/* Preferences - Language */}
          <div>
            <Label>{t('account.language')}</Label>
            <SimpleSelect
              value={localPrefs.language ?? ''}
              onChange={val => {
                i18n.changeLanguage(val);
                setLocalPrefs(prev => ({ ...prev, language: val }));
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
              onChange={val => setLocalPrefs(prev => ({ ...prev, region: val }))}
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
              onChange={val => setLocalPrefs(prev => ({ ...prev, currency: val }))}
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
            <Input
              value={localUser.address ?? ''}
              onChange={e => handleFieldChange('address', e.target.value)}
              autoComplete="street-address"
            />
          </div>

          <div>
            <Label>{t('account.city')}</Label>
            <Input value={localUser.city ?? ''} onChange={e => handleFieldChange('city', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.state')}</Label>
            <Input value={localUser.state ?? ''} onChange={e => handleFieldChange('state', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.zip')}</Label>
            <Input value={localUser.zip ?? ''} onChange={e => handleFieldChange('zip', e.target.value)} />
          </div>

          <div>
            <Label>{t('account.country')}</Label>
            <Input value={localUser.country ?? ''} onChange={e => handleFieldChange('country', e.target.value)} />
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
              onChange={e =>
                setLocalLoc(prev => ({
                  ...(prev ?? { lat: 0, lng: 0, updatedAt: Timestamp.now() }),
                  address: e.target.value,
                }))
              }
              placeholder={t('account.address_placeholder')}
            />

            {locError && <p className="text-sm text-red-500 mt-2">{locError}</p>}
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
            <Button type="button" onClick={handleSaveAll} disabled={isSavingDisabled}>
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
