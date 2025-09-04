'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/src/lib/users/userTypes';
import { Input } from '@/src/components/ui/input';
import { useTranslation } from 'react-i18next';

/**
 * UserSearch
 * - Text search + role filter (single select)
 * - Accent-insensitive (Vietnamese-friendly)
 * - Uncontrolled/controlled for both term and role
 *
 * Usage:
 * <UserSearch users={users} onResult={setFilteredUsers} />
 * // or controlled
 * <UserSearch users={users} value={term} onChangeTerm={setTerm} roleValue={role} onChangeRole={setRole} onResult={setFilteredUsers} />
 */

interface Props {
  users: User[];
  onResult: (filtered: User[]) => void;
  // term control (optional)
  value?: string;
  onChangeTerm?: (value: string) => void;
  // role control (optional)
  roleValue?: string; // e.g. 'all' | 'admin' | 'technician' ...
  onChangeRole?: (role: string) => void;
  // optionally override role options order
  roleOptions?: string[]; // array of role keys
}

// Remove accents and lowercase for robust matching (vi/en friendly)
function norm(input: unknown): string {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .trim();
}

function composeProfileAddress(u: User): string {
  const pa = u.profileAddress as any;
  if (!pa) return '';
  if (pa.formatted) return String(pa.formatted);
  const parts = [pa.line1, pa.line2, pa.locality, pa.adminArea, pa.postalCode, pa.countryCode]
    .filter(Boolean)
    .map((x: unknown) => String(x).trim());
  return parts.join(', ');
}

const DEFAULT_ROLE_ORDER = [
  'all',
  'admin',
  'company_owner',
  'station_manager',
  'staff',
  'agent',
  'technician',
  'technician_partner',
  'technician_assistant',
  'private_provider',
  'investor',
  'customer',
  'city_driver',
  'intercity_driver',
  'delivery_partner',
  'intercity_bus',
  'vehicle_transport',
  'tour_guide'
];

export default function UserSearch({
  users,
  onResult,
  value,
  onChangeTerm,
  roleValue,
  onChangeRole,
  roleOptions,
}: Props) {
  const { t } = useTranslation('common');

  // term state (uncontrolled fallback)
  const [term, setTerm] = useState('');
  const activeTerm = value ?? term;
  const nTerm = norm(activeTerm);

  // role state (uncontrolled fallback)
  const [role, setRole] = useState('all');
  const activeRole = roleValue ?? role; // role key or 'all'

  // unified setters
  const handleTermChange = (val: string) => {
    onChangeTerm ? onChangeTerm(val) : setTerm(val);
  };
  const handleRoleChange = (val: string) => {
    onChangeRole ? onChangeRole(val) : setRole(val);
  };

  // derive role options (keys) either from prop or from present users
  const roleCandidates = useMemo(() => {
    if (roleOptions && roleOptions.length) return ['all', ...roleOptions.filter((r) => r !== 'all')];
    const set = new Set<string>();
    for (const u of users) if (u.role) set.add(String(u.role).trim());
    // ensure stable order based on DEFAULT_ROLE_ORDER, then append others
    const ordered = DEFAULT_ROLE_ORDER.filter((k) => k === 'all' || set.has(k));
    const others = Array.from(set).filter((k) => !ordered.includes(k));
    return [...ordered, ...others];
  }, [users, roleOptions]);

  const roleLabel = (key: string) => {
    if (key === 'all') return t('user_search.all_roles', { defaultValue: 'All roles' });
    // fallback to raw key if missing
    return t(`roles.${key}`, { defaultValue: key });
  };

  const filtered = useMemo(() => {
    const byRole = (u: User) => activeRole === 'all' || (u.role ?? '').toLowerCase() === activeRole.toLowerCase();

    if (!activeTerm) {
      return users.filter(byRole);
    }

    return users.filter((u) => {
      if (!byRole(u)) return false;

      // Core fields
      const name = `${u.name ?? ''} ${u.firstName ?? ''} ${u.lastName ?? ''}`;
      const email = u.email ?? '';
      const phone = u.phone ?? '';
      const role = u.role ?? '';
      const idNumber = u.idNumber ?? '';

      // Profile address (AddressCore)
      const addr = composeProfileAddress(u);

      // Preferences (language/region/currency)
      const prefs = [u.preferences?.language, u.preferences?.region, u.preferences?.currency]
        .filter(Boolean)
        .join(' ');

      // Contributions & referral (numbers treated as strings, searchable)
      const contrib = `${u.contributionPoints ?? ''} ${u.contributionLevel ?? ''} ${u.totalContributions ?? ''}`;
      const referral = `${u.referralCode ?? ''} ${u.referredBy ?? ''} ${u.referralPoints ?? ''} ${u.totalReferrals ?? ''}`;

      // Last known location (string-only fields)
      const lastLoc = `${u.lastKnownLocation?.location ?? ''} ${u.lastKnownLocation?.mapAddress ?? ''} ${u.lastKnownLocation?.address ?? ''}`;

      const haystack = norm([name, email, phone, role, idNumber, addr, prefs, contrib, referral, lastLoc].join(' '));

      return haystack.includes(nTerm);
    });
  }, [users, activeTerm, nTerm, activeRole]);

  // emit result
  useEffect(() => {
    onResult(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex w-full max-w-xl items-center gap-2">
        <Input
          value={activeTerm}
          onChange={(e) => handleTermChange(e.target.value)}
          placeholder={t('user_search.placeholder', {
            defaultValue: 'Search by name, email, phone, role, address, ID…',
          })}
          className="w-full"
        />
        {activeTerm && (
          <button
            type="button"
            onClick={() => handleTermChange('')}
            className="shrink-0 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            aria-label={t('actions.clear', { defaultValue: 'Clear' })}
          >
            {t('actions.clear', { defaultValue: 'Clear' })}
          </button>
        )}
      </div>

      {/* Role select */}
      <div className="flex items-center gap-2">
        <select
          value={activeRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          {roleCandidates.map((key) => (
            <option key={key} value={key}>
              {roleLabel(key)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}