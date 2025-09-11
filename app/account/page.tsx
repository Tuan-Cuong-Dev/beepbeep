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
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { composeFromAddressCore } from '@/src/utils/address';

// ===== Helpers =====
const sanitizeReferral = (idNumber?: string) =>
  idNumber ? idNumber.trim().replace(/\s+/g, '').toUpperCase() : undefined;

const toISODateOrEmpty = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
};

// Trạng thái địa điểm cho UI (tránh dùng GeoPoint trong input)
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
  const { location: dbLocation, updateLocation } = useUserLocation(user?.uid ?? '');
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

  // Refresh state
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // ===== Sync remote → local =====
  useEffect(() => {
    setLocalUser(user ?? null);
  }, [user]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // ép về Timestamp an toàn
  const ensureTimestamp = (v: unknown): Timestamp =>
    v instanceof Timestamp ? v : Timestamp.now();

  // Map DB location → editable state
  useEffect(() => {
    if (!dbLocation) {
      setLocalLoc(null);
      return;
    }
    setLocalLoc({
      lat: dbLocation.geo.latitude,
      lng: dbLocation.geo.longitude,
      address: dbLocation.address ?? '',
      updatedAt: ensureTimestamp(dbLocation.updatedAt),
    });
  }, [dbLocation]);

  // Khi browser định vị → cập nhật editable state
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

  // Auto-fill profileAddress.formatted từ tọa độ nếu trống
  useEffect(() => {
    const run = async () => {
      if (!localLoc?.lat || !localLoc?.lng) return;
      if (localUser?.profileAddress?.formatted) return;
      try {
        const r = await fetch(
          `/api/revgeo?lat=${localLoc.lat}&lng=${localLoc.lng}&lang=${i18n.language}`
        );
        if (!r.ok) return;
        const { formatted, addressCore } = await r.json();
        setLocalUser(prev => {
          const pa = { ...(prev?.profileAddress ?? {}), ...(addressCore ?? {}) };
          pa.formatted = (formatted && String(formatted).trim()) || composeFromAddressCore(pa);
          return { ...(prev ?? {}), profileAddress: pa };
        });
      } catch (e) {
        console.warn('revgeo failed:', e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localLoc?.lat, localLoc?.lng, i18n.language]);

  // ===== Derived UI states =====
  const isBusy = loading || !user || !localUser;
  const isSavingDisabled = !localUser || !user?.uid;

  const latText = useMemo(() => {
    if (locLoading || manualRefreshing) return t('account.fetching_location');
    return typeof localLoc?.lat === 'number' ? String(localLoc.lat) : '';
  }, [locLoading, manualRefreshing, localLoc?.lat, t]);

  const lngText = useMemo(() => {
    if (locLoading || manualRefreshing) return t('account.fetching_location');
    return typeof localLoc?.lng === 'number' ? String(localLoc.lng) : '';
  }, [locLoading, manualRefreshing, localLoc?.lng, t]);

  // ===== Helpers =====
  const showNotification = (type: NotificationType, title: string, description?: string) => {
    setNotifyType(type);
    setNotifyTitle(title);
    setNotifyDescription(description ?? '');
    setNotifyOpen(true);
  };

  const handleFieldChange = <K extends keyof AppUser>(field: K, value: AppUser[K]) => {
    setLocalUser(prev => (prev ? { ...prev, [field]: value } : { [field]: value } as Partial<AppUser>));
  };

  const setProfileAddr = <K extends keyof AddressCore>(field: K, value: AddressCore[K]) => {
    setLocalUser(prev => {
      const curr = prev ?? {};
      const pa = curr.profileAddress ?? {};
      return { ...curr, profileAddress: { ...pa, [field]: value } };
    });
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
      const referralCode = sanitizeReferral(localUser.idNumber);

      // đảm bảo formatted luôn có
      const pa = localUser.profileAddress;
      const finalizedPA = pa
        ? { ...pa, formatted: (pa.formatted && pa.formatted.trim()) || composeFromAddressCore(pa) }
        : undefined;

      // strip các field legacy nếu còn
      const {
        address: _legacy1,
        address2: _legacy2,
        city: _legacy3,
        state: _legacy4,
        zip: _legacy5,
        country: _legacy6,
        ...rest
      } = localUser as any;

      const cleanedUserData: Partial<AppUser> = {
        ...rest,
        referralCode,
        ...(finalizedPA ? { profileAddress: finalizedPA } : {}),
      };

      // lọc undefined/null
      const payload = Object.fromEntries(
        Object.entries(cleanedUserData).filter(([, v]) => v !== undefined && v !== null)
      );

      await update(payload);
      await updatePreferences(localPrefs);

      // Lưu lastKnownLocation
      if (typeof localLoc?.lat === 'number' && typeof localLoc?.lng === 'number') {
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
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-semibold border-b-2 border-[#00d289] pb-2">
          {t('user_sidebar.menu.account_info')}
        </h2>

        <form onSubmit={e => e.preventDefault()} className="grid grid-cols-1 gap-6">
          {/* ===== Card: Thông tin cơ bản ===== */}
          <section className="border rounded-xl bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label>{t('account.first_name')}</Label>
              <Input
                value={localUser?.firstName ?? ''}
                onChange={e => handleFieldChange('firstName', e.target.value)}
                autoComplete="given-name"
              />
            </div>

            {/* Last Name */}
            <div>
              <Label>{t('account.last_name')}</Label>
              <Input
                value={localUser?.lastName ?? ''}
                onChange={e => handleFieldChange('lastName', e.target.value)}
                autoComplete="family-name"
              />
            </div>

            {/* Full Name */}
            <div className="md:col-span-2">
              <Label>{t('account.full_name')}</Label>
              <Input
                value={localUser?.name ?? ''}
                onChange={e => handleFieldChange('name', e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Gender */}
            <div>
              <Label>{t('account.gender')}</Label>
              <SimpleSelect
                value={localUser?.gender ?? ''}
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
            <div>
              <Label>{t('account.id_number')}</Label>
              <Input
                value={localUser?.idNumber ?? ''}
                onChange={e => handleFieldChange('idNumber', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">{t('account.referral_hint')}</p>
            </div>

            {/* Phone */}
            <div>
              <Label>{t('account.phone')}</Label>
              <Input
                value={localUser?.phone ?? ''}
                onChange={e => handleFieldChange('phone', e.target.value)}
                autoComplete="tel"
              />
            </div>

            {/* Email */}
            <div>
              <Label>{t('account.email')}</Label>
              <Input value={localUser?.email ?? ''} readOnly />
              <p className="text-sm text-gray-500 mt-1">{t('account.login_email_note')}</p>
            </div>

            {/* Password */}
            <div>
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
          </section>

          {/* ===== Card: Preferences ===== */}
          <section className="border rounded-xl bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Language */}
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

            {/* Region */}
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

            {/* Currency */}
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
          </section>

          {/* ===== Card: Profile Address (AddressCore) ===== */}
          <section className="border rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold mb-2">{t('account.profile_address')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t('account.addr.line1')}</Label>
                <Input
                  value={localUser?.profileAddress?.line1 ?? ''}
                  onChange={e => setProfileAddr('line1', e.target.value)}
                  autoComplete="address-line1"
                />
              </div>
              <div>
                <Label>{t('account.addr.line2')}</Label>
                <Input
                  value={localUser?.profileAddress?.line2 ?? ''}
                  onChange={e => setProfileAddr('line2', e.target.value)}
                  autoComplete="address-line2"
                />
              </div>
              <div>
                <Label>{t('account.addr.locality')}</Label>
                <Input
                  value={localUser?.profileAddress?.locality ?? ''}
                  onChange={e => setProfileAddr('locality', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <Label>{t('account.addr.admin_area')}</Label>
                <Input
                  value={localUser?.profileAddress?.adminArea ?? ''}
                  onChange={e => setProfileAddr('adminArea', e.target.value)}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <Label>{t('account.addr.postal_code')}</Label>
                <Input
                  value={localUser?.profileAddress?.postalCode ?? ''}
                  onChange={e => setProfileAddr('postalCode', e.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div>
                <Label>{t('account.addr.country_code')}</Label>
                <Input
                  value={localUser?.profileAddress?.countryCode ?? ''}
                  onChange={e => setProfileAddr('countryCode', e.target.value.toUpperCase())}
                  placeholder="US, VN, GB…"
                />
              </div>
              <div className="md:col-span-2">
                <Label>{t('account.addr.formatted')}</Label>
                <Input
                  value={localUser?.profileAddress?.formatted ?? ''}
                  onChange={e => setProfileAddr('formatted', e.target.value)}
                  placeholder={t('account.addr.formatted_placeholder')}
                />
              </div>
            </div>
          </section>

          {/* ===== Card: Last Known Location ===== */}
          <section className="border rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
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
              className="mb-3"
              value={localLoc?.address ?? ''}
              onChange={e =>
                setLocalLoc(prev => ({
                  ...(prev ?? { lat: 0, lng: 0, updatedAt: Timestamp.now() }),
                  address: e.target.value,
                }))
              }
              placeholder={t('account.address_placeholder')}
            />

            {locError && <p className="text-sm text-red-500 mb-2">{locError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t('account.latitude')}</Label>
                <Input value={latText} readOnly />
              </div>
              <div>
                <Label>{t('account.longitude')}</Label>
                <Input value={lngText} readOnly />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4">
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
