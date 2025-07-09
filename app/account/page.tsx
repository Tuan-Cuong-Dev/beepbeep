'use client';

import { useEffect, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/src/firebaseConfig';

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
  const { user, loading, update } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences(user?.uid);
  const { location, updateLocation } = useUserLocation(user?.uid);

  const [localUser, setLocalUser] = useState(user);
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [localLoc, setLocalLoc] = useState<UserLocation | null>(null);

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
      showNotification('info', 'Password Reset', 'A password reset email has been sent.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', 'Reset Failed', msg);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.uid || !localUser) return;

    try {
      await update({
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
      });

      await updatePreferences(localPrefs);

      if (localLoc?.lat !== undefined && localLoc?.lng !== undefined) {
        await updateLocation({
          lat: localLoc.lat,
          lng: localLoc.lng,
          address: localLoc.address || '',
          updatedAt: localLoc.updatedAt ?? Timestamp.now(),
        });
      }

      showNotification('success', 'Profile Updated', 'Your profile was saved successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', 'Update Failed', msg);
    }
  };

  if (loading || !user || !localUser) return <div className="p-6">Loading...</div>;

  return (
    <>
      <Header />
      <UserTopMenu />
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">Account Info</h2>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-6 rounded shadow-lg bg-white"
        >
          {/* Personal Info */}
          <div>
            <Label>First Name</Label>
            <Input value={localUser.firstName ?? ''} onChange={(e) => handleFieldChange('firstName', e.target.value)} />
          </div>

          <div>
            <Label>Last Name</Label>
            <Input value={localUser.lastName ?? ''} onChange={(e) => handleFieldChange('lastName', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label>Full Name</Label>
            <Input value={localUser.name ?? ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
          </div>

          <div>
            <Label>Gender</Label>
            <SimpleSelect
              value={localUser.gender ?? undefined}
              onChange={(val) => handleFieldChange('gender', val)}
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ]}
              placeholder="Select gender"
            />
          </div>

          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={localUser.dateOfBirth ?? ''}
              onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
            />
          </div>

          <div>
            <Label>ID Number</Label>
            <Input value={localUser.idNumber ?? ''} onChange={(e) => handleFieldChange('idNumber', e.target.value)} />
          </div>

          <div>
            <Label>Phone</Label>
            <Input value={localUser.phone ?? ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label>Email</Label>
            <Input value={localUser.email ?? ''} readOnly />
            <p className="text-sm text-gray-500 mt-1">* This email is your login email.</p>
          </div>

          <div className="md:col-span-2">
            <Label>Password</Label>
            <Input type="password" value="********" disabled />
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-[#00d289] mt-2 hover:underline"
            >
              Reset your password
            </button>
          </div>

          {/* Preferences */}
          <div>
            <Label>Language</Label>
            <SimpleSelect
              value={localPrefs.language ?? undefined}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, language: val }))}
              options={[
                { label: 'English', value: 'en' },
                { label: 'Vietnamese', value: 'vi' },
                { label: 'Korean', value: 'ko' },
              ]}
            />
          </div>

          <div>
            <Label>Region</Label>
            <SimpleSelect
              value={localPrefs.region ?? undefined}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, region: val }))}
              options={[
                { label: 'Vietnam', value: 'VN' },
                { label: 'South Korea', value: 'KR' },
                { label: 'United States', value: 'US' },
              ]}
            />
          </div>

          <div>
            <Label>Currency</Label>
            <SimpleSelect
              value={localPrefs.currency ?? undefined}
              onChange={(val) => setLocalPrefs((prev) => ({ ...prev, currency: val }))}
              options={[
                { label: 'VND', value: 'VND' },
                { label: 'USD', value: 'USD' },
                { label: 'KRW', value: 'KRW' },
              ]}
            />
          </div>

          {/* Static Address */}
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input value={localUser.address ?? ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
          </div>

          <div>
            <Label>City</Label>
            <Input value={localUser.city ?? ''} onChange={(e) => handleFieldChange('city', e.target.value)} />
          </div>

          <div>
            <Label>State</Label>
            <Input value={localUser.state ?? ''} onChange={(e) => handleFieldChange('state', e.target.value)} />
          </div>

          <div>
            <Label>ZIP</Label>
            <Input value={localUser.zip ?? ''} onChange={(e) => handleFieldChange('zip', e.target.value)} />
          </div>

          <div>
            <Label>Country</Label>
            <Input value={localUser.country ?? ''} onChange={(e) => handleFieldChange('country', e.target.value)} />
          </div>

          {/* Last Known Location */}
          <div className="md:col-span-2">
            <Label>Last Known Address</Label>
            <Input
              value={localLoc?.address ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { lat: 0, lng: 0, updatedAt: Timestamp.now() }),
                  address: e.target.value,
                }))
              }
              placeholder="e.g. 123 Main St, Hanoi"
            />
          </div>

          <div>
            <Label>Latitude</Label>
            <Input
              value={localLoc?.lat?.toString() ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { address: '', lng: 0, updatedAt: Timestamp.now() }),
                  lat: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="Latitude"
            />
          </div>

          <div>
            <Label>Longitude</Label>
            <Input
              value={localLoc?.lng?.toString() ?? ''}
              onChange={(e) =>
                setLocalLoc((prev) => ({
                  ...(prev ?? { address: '', lat: 0, updatedAt: Timestamp.now() }),
                  lng: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="Longitude"
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex gap-4 mt-6">
            <Button type="button" onClick={handleSaveAll}>
              Save
            </Button>
            <Button type="button" variant="ghost">
              Cancel
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
