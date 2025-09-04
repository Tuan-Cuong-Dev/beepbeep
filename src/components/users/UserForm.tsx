'use client';

import { useEffect } from 'react';
import type { User } from '@/src/lib/users/userTypes';
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import type { UserLocation } from '@/src/lib/locations/locationTypes';
import { useTranslation } from 'react-i18next';

// Align BusinessType with summary & search components
type BusinessType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner'
  | 'city_driver'
  | 'intercity_driver'
  | 'delivery_partner'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

interface Props {
  user: Partial<User> & { businessType?: BusinessType };
  setUser: (user: Partial<User> & { businessType?: BusinessType }) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  onSubmit: () => Promise<void>;
}

export default function UserForm({ user, setUser, editingUser, setEditingUser, onSubmit }: Props) {
  const { t } = useTranslation('common');

  // Autofill when editing from table
  useEffect(() => {
    if (editingUser) {
      setUser({
        ...editingUser,
        profileAddress: editingUser.profileAddress ?? {
          line1: '',
          line2: '',
          locality: '',
          adminArea: '',
          postalCode: '',
          countryCode: '',
          formatted: '',
        },
        preferences: editingUser.preferences ?? {
          language: '',
          region: '',
          currency: '',
        },
        lastKnownLocation: (editingUser.lastKnownLocation ?? {
          location: '',
          mapAddress: '',
          address: '',
        }) as UserLocation,
      });
    }
  }, [editingUser, setUser]);

  // Helpers
  const setProfileAddr = <K extends keyof AddressCore>(field: K, value: AddressCore[K]) => {
    const current = user ?? {};
    const pa = (current.profileAddress ?? {}) as AddressCore;
    setUser({ ...current, profileAddress: { ...pa, [field]: value } });
  };

  const setPref = <K extends keyof NonNullable<User['preferences']>>(
    field: K,
    value: NonNullable<User['preferences']>[K],
  ) => {
    const current = user ?? {};
    const pref = (current.preferences ?? { language: '', region: '', currency: '' }) as NonNullable<
      User['preferences']
    >;
    setUser({ ...current, preferences: { ...pref, [field]: value } });
  };

  const setLastLoc = <K extends keyof UserLocation>(field: K, value: UserLocation[K]) => {
    const current = user ?? {};
    const loc = (current.lastKnownLocation ?? {}) as UserLocation;
    setUser({ ...current, lastKnownLocation: { ...loc, [field]: value } });
  };

  return (
    <div className="hidden md:block mb-6 mt-6 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {editingUser ? t('user_form.update_user') : t('user_form.add_user')}
        </h2>
        {editingUser && <span className="text-xs text-gray-500">UID: {editingUser.uid}</span>}
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder={t('user_form.first_name')}
          value={user.firstName ?? ''}
          onChange={(e) => setUser({ ...user, firstName: e.target.value })}
          className="w-full rounded border p-2"
          autoComplete="given-name"
        />
        <input
          type="text"
          placeholder={t('user_form.last_name')}
          value={user.lastName ?? ''}
          onChange={(e) => setUser({ ...user, lastName: e.target.value })}
          className="w-full rounded border p-2"
          autoComplete="family-name"
        />
        <input
          type="text"
          placeholder={t('user_form.display_name')}
          value={user.name ?? ''}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          className="w-full rounded border p-2"
          autoComplete="name"
        />
        <input
          type="email"
          placeholder={t('user_form.email')}
          value={user.email ?? ''}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          className="w-full rounded border p-2"
          autoComplete="email"
        />
        <input
          type="text"
          placeholder={t('user_form.phone')}
          value={user.phone ?? ''}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
          className="w-full rounded border p-2"
          autoComplete="tel"
        />
        <input
          type="text"
          placeholder={t('user_form.photo_url')}
          value={user.photoURL ?? ''}
          onChange={(e) => setUser({ ...user, photoURL: e.target.value })}
          className="w-full rounded border p-2"
        />

        {/* Role */}
        <select
          value={user.role ?? 'customer'}
          onChange={(e) => setUser({ ...user, role: e.target.value })}
          className="w-full rounded border p-2"
        >
          <option value="customer">{t('roles.customer')}</option>
          <option value="staff">{t('roles.staff')}</option>
          <option value="agent">{t('roles.agent')}</option>
          <option value="station_manager">{t('roles.station_manager')}</option>
          <option value="company_owner">{t('roles.company_owner')}</option>
          <option value="technician">{t('roles.technician')}</option>
          <option value="technician_partner">{t('roles.technician_partner')}</option>
          <option value="technician_assistant">{t('roles.technician_assistant')}</option>
          <option value="private_provider">{t('roles.private_provider')}</option>
          <option value="city_driver">{t('roles.city_driver')}</option>
          <option value="intercity_driver">{t('roles.intercity_driver')}</option>
          <option value="delivery_partner">{t('roles.delivery_partner')}</option>
          <option value="intercity_bus">{t('roles.intercity_bus')}</option>
          <option value="vehicle_transport">{t('roles.vehicle_transport')}</option>
          <option value="tour_guide">{t('roles.tour_guide')}</option>
          <option value="investor">{t('roles.investor')}</option>
          <option value="admin">{t('roles.admin')}</option>
        </select>

        {/* Business Type */}
        <select
          value={(user as any).businessType ?? ''}
          onChange={(e) => setUser({ ...user, businessType: e.target.value as BusinessType })}
          className="w-full rounded border p-2"
        >
          <option value="">{t('business_types.placeholder', 'Business type (optional)')}</option>
          <option value="rental_company">{t('business_types.rental_company', 'Rental Company')}</option>
          <option value="private_provider">{t('business_types.private_provider', 'Private Vehicle Provider')}</option>
          <option value="agent">{t('business_types.agent', 'Agent')}</option>
          <option value="technician_partner">{t('business_types.technician_partner', 'Technician Partner')}</option>
          <option value="city_driver">{t('business_types.city_driver', 'City Driver')}</option>
          <option value="intercity_driver">{t('business_types.intercity_driver', 'Intercity Driver')}</option>
          <option value="delivery_partner">{t('business_types.delivery_partner', 'Delivery Partner')}</option>
          <option value="intercity_bus">{t('business_types.intercity_bus', 'Intercity Bus Company')}</option>
          <option value="vehicle_transport">{t('business_types.vehicle_transport', 'Vehicle Transporter')}</option>
          <option value="tour_guide">{t('business_types.tour_guide', 'Tour Guide')}</option>
        </select>

        {/* Company (optional / role-based) */}
        <input
          type="text"
          placeholder={t('user_form.company_id_optional')}
          value={user.companyId ?? ''}
          onChange={(e) => setUser({ ...user, companyId: e.target.value })}
          className="w-full rounded border p-2"
        />

        {/* Home Airport */}
        <input
          type="text"
          placeholder={t('user_form.home_airport')}
          value={user.homeAirport ?? ''}
          onChange={(e) => setUser({ ...user, homeAirport: e.target.value })}
          className="w-full rounded border p-2"
        />
      </div>

      {/* Profile Address (AddressCore) */}
      <div className="mt-6 rounded-lg border bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.profile_address_section')}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder={t('address.line1')}
            value={user.profileAddress?.line1 ?? ''}
            onChange={(e) => setProfileAddr('line1', e.target.value)}
            className="w-full rounded border p-2"
            autoComplete="address-line1"
          />
          <input
            type="text"
            placeholder={t('address.line2')}
            value={user.profileAddress?.line2 ?? ''}
            onChange={(e) => setProfileAddr('line2', e.target.value)}
            className="w-full rounded border p-2"
            autoComplete="address-line2"
          />
          <input
            type="text"
            placeholder={t('address.locality')}
            value={user.profileAddress?.locality ?? ''}
            onChange={(e) => setProfileAddr('locality', e.target.value)}
            className="w-full rounded border p-2"
            autoComplete="address-level2"
          />
          <input
            type="text"
            placeholder={t('address.admin_area')}
            value={user.profileAddress?.adminArea ?? ''}
            onChange={(e) => setProfileAddr('adminArea', e.target.value)}
            className="w-full rounded border p-2"
            autoComplete="address-level1"
          />
          <input
            type="text"
            placeholder={t('address.postal_code')}
            value={user.profileAddress?.postalCode ?? ''}
            onChange={(e) => setProfileAddr('postalCode', e.target.value)}
            className="w-full rounded border p-2"
            autoComplete="postal-code"
          />
          <input
            type="text"
            placeholder={t('address.country_code')}
            value={user.profileAddress?.countryCode ?? ''}
            onChange={(e) => setProfileAddr('countryCode', e.target.value.toUpperCase())}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('address.formatted')}
            value={user.profileAddress?.formatted ?? ''}
            onChange={(e) => setProfileAddr('formatted', e.target.value)}
            className="w-full rounded border p-2 md:col-span-2"
          />
        </div>
      </div>

      {/* Extra info */}
      <div className="mt-6 rounded-lg border bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.extra_info_section')}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder={t('user_form.id_number')}
            value={user.idNumber ?? ''}
            onChange={(e) => setUser({ ...user, idNumber: e.target.value })}
            className="w-full rounded border p-2"
          />
          <select
            value={user.gender ?? ''}
            onChange={(e) => setUser({ ...user, gender: e.target.value as User['gender'] })}
            className="w-full rounded border p-2"
          >
            <option value="">{t('user_form.gender_placeholder')}</option>
            <option value="male">{t('user_form.gender_male')}</option>
            <option value="female">{t('user_form.gender_female')}</option>
            <option value="other">{t('user_form.gender_other')}</option>
          </select>
          <input
            type="date"
            placeholder={t('user_form.date_of_birth')}
            value={user.dateOfBirth ?? ''}
            onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value })}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('user_form.cover_url')}
            value={user.coverURL ?? ''}
            onChange={(e) => setUser({ ...user, coverURL: e.target.value })}
            className="w-full rounded border p-2 md:col-span-3"
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="mt-6 rounded-lg border bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.preferences_section')}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder={t('preferences.language')}
            value={user.preferences?.language ?? ''}
            onChange={(e) => setPref('language', e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('preferences.region')}
            value={user.preferences?.region ?? ''}
            onChange={(e) => setPref('region', e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('preferences.currency')}
            value={user.preferences?.currency ?? ''}
            onChange={(e) => setPref('currency', e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>
      </div>

      {/* Contribution & Referral */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.contribution_section')}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="number"
              placeholder={t('user_form.contribution_points')}
              value={user.contributionPoints ?? 0}
              onChange={(e) => setUser({ ...user, contributionPoints: Number(e.target.value) })}
              className="w-full rounded border p-2"
            />
            <input
              type="number"
              placeholder={t('user_form.contribution_level')}
              value={user.contributionLevel ?? 1}
              onChange={(e) =>
                setUser({
                  ...user,
                  contributionLevel: Number(e.target.value) as User['contributionLevel'],
                })
              }
              className="w-full rounded border p-2"
            />
            <input
              type="number"
              placeholder={t('user_form.total_contributions')}
              value={user.totalContributions ?? 0}
              onChange={(e) => setUser({ ...user, totalContributions: Number(e.target.value) })}
              className="w-full rounded border p-2"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.referral_section')}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder={t('user_form.referral_code')}
              value={user.referralCode ?? ''}
              onChange={(e) => setUser({ ...user, referralCode: e.target.value })}
              className="w-full rounded border p-2"
            />
            <input
              type="text"
              placeholder={t('user_form.referred_by')}
              value={user.referredBy ?? ''}
              onChange={(e) => setUser({ ...user, referredBy: e.target.value })}
              className="w-full rounded border p-2"
            />
            <input
              type="number"
              placeholder={t('user_form.referral_points')}
              value={user.referralPoints ?? 0}
              onChange={(e) => setUser({ ...user, referralPoints: Number(e.target.value) })}
              className="w-full rounded border p-2"
            />
            <input
              type="number"
              placeholder={t('user_form.total_referrals')}
              value={user.totalReferrals ?? 0}
              onChange={(e) => setUser({ ...user, totalReferrals: Number(e.target.value) })}
              className="w-full rounded border p-2"
            />
          </div>
        </div>
      </div>

      {/* Last known location (string inputs; GeoPoint set on submit) */}
      <div className="mt-6 rounded-lg border bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">{t('user_form.last_location_section')}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder={t('location.location_string_example')}
            value={user.lastKnownLocation?.location ?? ''}
            onChange={(e) => setLastLoc('location', e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('location.map_address')}
            value={user.lastKnownLocation?.mapAddress ?? ''}
            onChange={(e) => setLastLoc('mapAddress', e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder={t('location.address')}
            value={user.lastKnownLocation?.address ?? ''}
            onChange={(e) => setLastLoc('address', e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{t('location.note_geopoint_will_be_set_on_submit')}</p>
      </div>

      {/* Actions */}
      {editingUser ? (
        <div className="mt-4 flex gap-3">
          <button
            onClick={onSubmit}
            className="rounded bg-[#00d289] px-4 py-2 font-medium text-white hover:opacity-90"
          >
            {t('actions.update_user')}
          </button>
          <button
            onClick={() => setEditingUser(null)}
            className="rounded bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
          >
            {t('actions.cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={onSubmit}
          className="mt-4 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          {t('actions.add_user')}
        </button>
      )}
    </div>
  );
}
