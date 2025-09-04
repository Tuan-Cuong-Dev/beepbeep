'use client';

import { useMemo } from 'react';
import type { User } from '@/src/lib/users/userTypes';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

// Keep in sync with UserForm & UserSummaryCard
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
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (uid: string) => void;
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  );
}

function formatAddress(u: User): string {
  const pa = u.profileAddress;
  if (!pa) return '';
  if (pa.formatted && pa.formatted.trim()) return pa.formatted;
  const parts = [pa.line1, pa.line2, pa.locality, pa.adminArea, pa.postalCode, pa.countryCode]
    .filter(Boolean)
    .map((s) => String(s).trim());
  return parts.join(', ');
}

export default function UserTable({ users, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');

  // safe i18n wrapper
  const td = (key: string, def?: string) => (def ? t(key, { defaultValue: def }) : t(key));

  // ===== Role labels (extended) =====
  const roleLabel = useMemo(
    () => ({
      Customer: t('roles.Customer'),
      staff: t('roles.staff'),
      agent: t('roles.agent'),
      station_manager: t('roles.station_manager'),
      company_owner: t('roles.company_owner'),
      technician: t('roles.technician'),
      technician_partner: t('roles.technician_partner'),
      technician_assistant: t('roles.technician_assistant'),
      private_provider: t('roles.private_provider'),
      city_driver: t('roles.city_driver'),
      intercity_driver: t('roles.intercity_driver'),
      delivery_partner: t('roles.delivery_partner'),
      intercity_bus: t('roles.intercity_bus'),
      vehicle_transport: t('roles.vehicle_transport'),
      tour_guide: t('roles.tour_guide'),
      investor: t('roles.investor'),
      admin: t('roles.admin'),
      other: t('roles.other'),
    }),
    [t],
  );
  const getRoleText = (role: string) => roleLabel[role as keyof typeof roleLabel] ?? role;

  // ===== Business type labels =====
  const businessTypeLabel = useMemo(
    () => ({
      rental_company: td('business_types.rental_company', 'Rental Company'),
      private_provider: td('business_types.private_provider', 'Private Vehicle Provider'),
      agent: td('business_types.agent', 'Agent'),
      technician_partner: td('business_types.technician_partner', 'Technician Partner'),
      city_driver: td('business_types.city_driver', 'City Driver'),
      intercity_driver: td('business_types.intercity_driver', 'Intercity Driver'),
      delivery_partner: td('business_types.delivery_partner', 'Delivery Partner'),
      intercity_bus: td('business_types.intercity_bus', 'Intercity Bus Company'),
      vehicle_transport: td('business_types.vehicle_transport', 'Vehicle Transporter'),
      tour_guide: td('business_types.tour_guide', 'Tour Guide'),
    }),
    [t],
  );
  const getBusinessTypeText = (bt?: string) =>
    (bt ? businessTypeLabel[bt as BusinessType] : '') ?? (bt || '');

  const formatPrefs = (u: User) => {
    const p = u.preferences;
    if (!p) return '';
    const items = [p.language, p.region, p.currency].filter(Boolean);
    return items.join(' • ');
  };

  const formatContrib = (u: User) => {
    const pts = u.contributionPoints ?? 0;
    const lvl = u.contributionLevel ?? 0;
    const total = u.totalContributions ?? 0;
    return `${td('user_table.points', 'Pts')}: ${pts} • ${td('user_table.level', 'Lvl')}: ${lvl} • ${td('user_table.total', 'Total')}: ${total}`;
  };

  const formatReferral = (u: User) => {
    const code = u.referralCode || '-';
    const by = u.referredBy || '-';
    const pts = u.referralPoints ?? 0;
    const tot = u.totalReferrals ?? 0;
    return `${td('user_table.code', 'Code')}: ${code} • ${td('user_table.by', 'By')}: ${by} • ${td('user_table.points', 'Pts')}: ${pts} • ${td('user_table.total', 'Total')}: ${tot}`;
  };

  const formatLastLoc = (u: User) => {
    const l = u.lastKnownLocation;
    if (!l) return '';
    const pieces = [l.location, l.mapAddress, l.address].filter(Boolean);
    return pieces.join(' • ');
  };

  if (!users || users.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
        {td('user_table.empty', 'No users found.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => {
          const addr = formatAddress(u);
          const prefs = formatPrefs(u);
          const contrib = formatContrib(u);
          const referral = formatReferral(u);
          const lastLoc = formatLastLoc(u);
          const roleText = getRoleText(u.role);
          const btText = getBusinessTypeText((u as any).businessType);

          return (
            <div key={u.uid} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border">
                  <Image
                    src={u.photoURL || '/assets/images/technician.png'}
                    alt={u.name || 'User'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{u.name}</div>
                  <div className="truncate text-sm text-gray-600">{u.email}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge label={roleText} />
                    {btText && <Badge label={btText} />}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                {!!u.firstName && !!u.lastName && (
                  <p>
                    <b>{t('user_table.fullname', 'Full name')}:</b> {u.firstName} {u.lastName}
                  </p>
                )}
                {u.phone && (
                  <p>
                    <b>📞</b> {u.phone}
                  </p>
                )}

                {u.homeAirport && (
                  <p>
                    <b>{t('user_table.home_airport', 'Home airport')}:</b> {u.homeAirport}
                  </p>
                )}
                {addr && (
                  <p>
                    <b>📍</b> {addr}
                  </p>
                )}

                {(u.idNumber || u.gender || u.dateOfBirth) && (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-500">{t('user_table.extra_info', 'Extra info')}</p>
                    {u.idNumber && (
                      <p>
                        <b>{t('user_table.id_number', 'ID Number')}:</b> {u.idNumber}
                      </p>
                    )}
                    {u.gender && (
                      <p>
                        <b>{t('user_table.gender', 'Gender')}:</b> {u.gender}
                      </p>
                    )}
                    {u.dateOfBirth && (
                      <p>
                        <b>{t('user_table.dob', 'Date of birth')}:</b> {u.dateOfBirth}
                      </p>
                    )}
                  </div>
                )}

                {prefs && (
                  <p>
                    <b>{t('user_table.preferences', 'Preferences')}:</b> {prefs}
                  </p>
                )}

                {(u.contributionPoints || u.contributionLevel || u.totalContributions) && (
                  <p>
                    <b>{t('user_table.contributions', 'Contributions')}:</b> {contrib}
                  </p>
                )}

                {(u.referralCode || u.referredBy || (u.referralPoints ?? 0) > 0 || (u.totalReferrals ?? 0) > 0) && (
                  <p>
                    <b>{t('user_table.referral', 'Referral')}:</b> {referral}
                  </p>
                )}

                {lastLoc && (
                  <p>
                    <b>{t('user_table.last_location', 'Last location')}:</b> {lastLoc}
                  </p>
                )}

                {u.coverURL && (
                  <div className="mt-2 overflow-hidden rounded-lg border">
                    <Image src={u.coverURL} alt="Cover" width={640} height={160} className="h-24 w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onEdit(u)}>
                  {t('actions.edit', 'Edit')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(u.uid)}>
                  {t('actions.delete', 'Delete')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto rounded bg-white p-4 shadow md:block">
        <table className="min-w-[1400px] text-sm">
          <thead className="text-left">
            <tr className="bg-gray-100">
              <th className="px-3 py-2">{td('user_table.col_photo', 'Photo')}</th>
              <th className="px-3 py-2">{td('user_table.col_name', 'Name')}</th>
              <th className="px-3 py-2">{td('user_table.col_first_name', 'First')}</th>
              <th className="px-3 py-2">{td('user_table.col_last_name', 'Last')}</th>
              <th className="px-3 py-2">{td('user_table.col_email', 'Email')}</th>
              <th className="px-3 py-2">{td('user_table.col_phone', 'Phone')}</th>
              <th className="px-3 py-2">{td('user_table.col_role', 'Role')}</th>
              <th className="px-3 py-2">{td('user_table.col_business_type', 'Business Type')}</th>
              <th className="px-3 py-2">{td('user_table.col_home_airport', 'Home Airport')}</th>
              <th className="px-3 py-2">{td('user_table.col_address', 'Profile Address')}</th>
              <th className="px-3 py-2">{td('user_table.col_id_number', 'ID Number')}</th>
              <th className="px-3 py-2">{td('user_table.col_gender', 'Gender')}</th>
              <th className="px-3 py-2">{td('user_table.col_dob', 'Date of Birth')}</th>
              <th className="px-3 py-2">{td('user_table.col_preferences', 'Preferences')}</th>
              <th className="px-3 py-2">{td('user_table.col_contributions', 'Contributions')}</th>
              <th className="px-3 py-2">{td('user_table.col_referral', 'Referral')}</th>
              <th className="px-3 py-2">{td('user_table.col_last_location', 'Last Location')}</th>
              <th className="px-3 py-2">{td('user_table.col_cover', 'Cover')}</th>
              <th className="px-3 py-2">{td('user_table.col_actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const addr = formatAddress(u);
              const prefs = formatPrefs(u);
              const contrib = formatContrib(u);
              const referral = formatReferral(u);
              const lastLoc = formatLastLoc(u);
              const roleText = getRoleText(u.role);
              const btText = getBusinessTypeText((u as any).businessType);

              return (
                <tr key={u.uid} className="border-t align-top hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Image
                      src={u.photoURL || '/assets/images/technician.png'}
                      alt={u.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.firstName || '—'}</td>
                  <td className="px-3 py-2">{u.lastName || '—'}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.phone || '—'}</td>
                  <td className="px-3 py-2">
                    <Badge label={roleText} />
                  </td>
                  <td className="px-3 py-2">{btText ? <Badge label={btText} /> : '—'}</td>
                  <td className="px-3 py-2">{u.homeAirport || '—'}</td>
                  <td className="px-3 py-2 max-w-[260px] truncate" title={addr}>
                    {addr || '—'}
                  </td>
                  <td className="px-3 py-2">{u.idNumber || '—'}</td>
                  <td className="px-3 py-2">{u.gender || '—'}</td>
                  <td className="px-3 py-2">{u.dateOfBirth || '—'}</td>
                  <td className="px-3 py-2 max-w-[220px] truncate" title={prefs}>
                    {prefs || '—'}
                  </td>
                  <td className="px-3 py-2 max-w-[260px] truncate" title={contrib}>
                    {contrib}
                  </td>
                  <td className="px-3 py-2 max-w-[300px] truncate" title={referral}>
                    {referral}
                  </td>
                  <td className="px-3 py-2 max-w-[300px] truncate" title={lastLoc}>
                    {lastLoc || '—'}
                  </td>
                  <td className="px-3 py-2">
                    {u.coverURL ? (
                      <Image src={u.coverURL} alt="Cover" width={80} height={28} className="h-10 w-20 rounded object-cover" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onEdit(u)}>
                        {td('actions.edit', 'Edit')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(u.uid)}>
                        {td('actions.delete', 'Delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
