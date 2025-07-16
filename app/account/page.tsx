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

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, loading, update } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences(user?.uid ?? '');
  const { location, updateLocation } = useUserLocation(user?.uid ?? '');

  const [localUser, setLocalUser] = useState(user);
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [localLoc, setLocalLoc] = useState<UserLocation | null>(null);

  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState('');

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyType, setNotifyType] = useState<NotificationType>('success');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyDescription, setNotifyDescription] = useState('');

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    setLocalLoc(location);
  }, [location]);

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
      const cleanedUserData = Object.fromEntries(
        Object.entries({
          firstName: localUser.firstName,
          lastName: localUser.lastName,
          name: localUser.name,
          gender: localUser.gender,
          dateOfBirth: localUser.dateOfBirth,
          idNumber: localUser.idNumber,
          phone: localUser.phone,
          address: localUser.address,
          city: localUser.city,
          state: localUser.state,
          zip: localUser.zip,
          country: localUser.country,
        }).filter(([_, value]) => value !== undefined)
      );

      await update(cleanedUserData);
      await updatePreferences(localPrefs);

      if (localLoc?.lat !== undefined && localLoc?.lng !== undefined) {
        await updateLocation({
          lat: localLoc.lat,
          lng: localLoc.lng,
          address: localLoc.address || '',
          updatedAt: localLoc.updatedAt ?? Timestamp.now(),
        });
      }

      showNotification('success', t('account.update_success'), t('account.saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', t('account.update_failed'), msg);
    }
  };

  if (loading || !user || !localUser) return <div className="p-6">{t('landing.loading')}</div>;

  return (
    <>
      <Header />
      <UserTopMenu />
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">{t('user_sidebar.menu.account_info')}</h2>

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
              placeholder={t('account.select_gender')}
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
          <div>
            <Label>{t('account.id_number')}</Label>
            <Input value={localUser.idNumber ?? ''} onChange={(e) => handleFieldChange('idNumber', e.target.value)} />
          </div>

          {/* Phone */}
          <div>
            <Label>{t('account.phone')}</Label>
            <Input value={localUser.phone ?? ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <Label>{t('account.email')}</Label>
            <Input value={localUser.email ?? ''} readOnly />
            <p className="text-sm text-gray-500 mt-1">{t('account.login_email_note')}</p>
          </div>

          {/* Password */}
          <div className="md:col-span-2">
            <Label>{t('account.password')}</Label>
            <Input type="password" value="********" disabled />
            <button type="button" onClick={handleResetPassword} className="text-sm text-[#00d289] mt-2 hover:underline">
              {t('account.reset_password')}
            </button>
          </div>

          {/* Preferences */}
          <div>
            <Label>{t('header.language')}</Label>
            <SimpleSelect
              value={localPrefs.language ?? ''}
              onChange={(val) => {
                i18n.changeLanguage(val);
                setLocalPrefs((prev) => ({ ...prev, language: val }));
              }}
              options={[
                { label: 'English', value: 'en' },
                { label: 'Vietnamese', value: 'vi' },
                { label: 'Korean', value: 'ko' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Japanese', value: 'ja' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Spanish', value: 'es' },
                { label: 'Portuguese', value: 'pt' },
                { label: 'Thai', value: 'th' },
                { label: 'Indonesian', value: 'id' },
                { label: 'Russian', value: 'ru' },
                { label: 'Hindi', value: 'hi' },
              ]}
            />
          </div>

          <div>
            <Label>{t('header.select_language')}</Label>
            <SimpleSelect
              value={localPrefs.region ?? ''}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, region: val }))}
              options={[
                { label: 'Vietnam', value: 'VN' },
                { label: 'South Korea', value: 'KR' },
                { label: 'United States', value: 'US' },
                { label: 'China', value: 'CN' },
                { label: 'Japan', value: 'JP' },
                { label: 'France', value: 'FR' },
                { label: 'Germany', value: 'DE' },
                { label: 'Spain', value: 'ES' },
                { label: 'Portugal', value: 'PT' },
                { label: 'Thailand', value: 'TH' },
                { label: 'Indonesia', value: 'ID' },
                { label: 'Russia', value: 'RU' },
                { label: 'India', value: 'IN' },
              ]}
            />
          </div>

          <div>
            <Label>{t('header.select_currency')}</Label>
            <SimpleSelect
              value={localPrefs.currency ?? ''}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, currency: val }))}
              options={[
                { label: 'VND - Vietnamese Dong', value: 'VND' },
                { label: 'USD - US Dollar', value: 'USD' },
                { label: 'KRW - South Korean Won', value: 'KRW' },
                { label: 'CNY - Chinese Yuan', value: 'CNY' },
                { label: 'JPY - Japanese Yen', value: 'JPY' },
                { label: 'EUR - Euro', value: 'EUR' },
                { label: 'GBP - British Pound', value: 'GBP' },
                { label: 'THB - Thai Baht', value: 'THB' },
                { label: 'IDR - Indonesian Rupiah', value: 'IDR' },
                { label: 'RUB - Russian Ruble', value: 'RUB' },
                { label: 'INR - Indian Rupee', value: 'INR' },
                { label: 'BRL - Brazilian Real', value: 'BRL' },
                { label: 'AUD - Australian Dollar', value: 'AUD' },
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

          {/* Location */}
          <div className="md:col-span-2">
            <Label>{t('account.last_known_address')}</Label>
            <Input
              value={localLoc?.address ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { lat: 0, lng: 0, updatedAt: Timestamp.now() }),
                  address: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label>{t('account.latitude')}</Label>
            <Input
              value={localLoc?.lat?.toString() ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { address: '', lng: 0, updatedAt: Timestamp.now() }),
                  lat: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div>
            <Label>{t('account.longitude')}</Label>
            <Input
              value={localLoc?.lng?.toString() ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { address: '', lat: 0, updatedAt: Timestamp.now() }),
                  lng: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

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
