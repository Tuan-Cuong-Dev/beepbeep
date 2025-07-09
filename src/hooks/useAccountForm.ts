'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountFormSchema } from '@/src/lib/validation/accountFormSchema';
import { z } from 'zod';

import { Button } from '@/src/components/ui/button';
import PersonalInfoSection from './PersonalInfoSection';
import PreferencesSection from './PreferencesSection';
import StaticAddressSection from './StaticAddressSection';
import LastKnownLocationSection from './LastKnownLocationSection';

import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useUserPreferences } from '@/src/hooks/useUserPreferences';
import { useUserLocation } from '@/src/hooks/useUserLocation';

const schema = accountFormSchema;
type AccountFormData = z.infer<typeof schema>;

export default function AccountForm() {
  const { user, update } = useUserProfile();
  const { updatePreferences } = useUserPreferences(user?.uid);
  const { updateLocation } = useUserLocation(user?.uid);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('name', user.name || '');
      setValue('gender', user.gender || 'other');
      setValue('dateOfBirth', user.dateOfBirth || '');
      setValue('idNumber', user.idNumber || '');
      setValue('phone', user.phone || '');
      setValue('address', user.address || '');
      setValue('city', user.city || '');
      setValue('state', user.state || '');
      setValue('zip', user.zip || '');
      setValue('country', user.country || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data: AccountFormData) => {
    await update({
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.name,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      idNumber: data.idNumber,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
    });

    await updatePreferences(data.preferences);

    if (data.lastKnownLocation) {
      await updateLocation({
        ...data.lastKnownLocation,
        updatedAt: new Date(),
      });
    }

    alert('Your profile has been updated.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PersonalInfoSection register={register} errors={errors} />
      <PreferencesSection register={register} errors={errors} />
      <StaticAddressSection register={register} errors={errors} />
      <LastKnownLocationSection register={register} errors={errors} />

      <div className="flex gap-4">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}