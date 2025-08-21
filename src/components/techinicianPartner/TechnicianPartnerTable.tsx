'use client';

import { useState, useMemo, useEffect } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import Pagination from '@/src/components/ui/pagination';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

// ⬇️ Firestore để đọc users
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface Props {
  partners: TechnicianPartner[];
  onEdit: (partner: TechnicianPartner) => void;
  onDelete?: (id: string) => void;
}

type UserLoc = {
  lat: number;
  lng: number;
  lastSeenAt?: Timestamp | null;
  source: 'users';
};

const IN_LIMIT = 10;
const LIVE_TTL_MIN = 15; // phút

export default function TechnicianPartnerTable({ partners, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');

  const [typeFilter, setTypeFilter] = useState<'all' | 'mobile' | 'shop'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'assignedRegions'>('name');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ========== 1) Lấy userId của các partner mobile ==========
  const mobileUserIds = useMemo(() => {
    const ids = partners
      .filter((p) => p.type === 'mobile' && p.userId)
      .map((p) => p.userId as string);
    // unique
    return Array.from(new Set(ids));
  }, [partners]);

  // ========== 2) Tạo map userId -> vị trí từ collections 'users' ==========
  const [userLocMap, setUserLocMap] = useState<Record<string, UserLoc>>({});

  useEffect(() => {
    let cancelled = false;
    if (mobileUserIds.length === 0) {
      setUserLocMap({});
      return;
    }

    const chunks: string[][] = [];
    for (let i = 0; i < mobileUserIds.length; i += IN_LIMIT) {
      chunks.push(mobileUserIds.slice(i, i + IN_LIMIT));
    }

    const extractUserLoc = (data: any): UserLoc | null => {
      // ✅ Đúng với schema bạn gửi
      const l = data?.lastKnownLocation;
      if (!l || typeof l.lat !== 'number' || typeof l.lng !== 'number') return null;

      // Sử dụng updatedAt của lastKnownLocation làm mốc LIVE
      const lastSeenAt: Timestamp | null = l.updatedAt ?? null;

      return {
        lat: l.lat,
        lng: l.lng,
        lastSeenAt,
        source: 'users',
      };
    };

    (async () => {
      const out: Record<string, UserLoc> = {};
      for (const batch of chunks) {
        const q = query(collection(db, 'users'), where('uid', 'in', batch));
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          const data = doc.data();
          const uid = data?.uid as string | undefined;
          if (!uid) return;
          const loc = extractUserLoc(data);
          if (loc) out[uid] = loc;
        });
      }
      if (!cancelled) setUserLocMap(out);
    })();

    return () => {
      cancelled = true;
    };
  }, [mobileUserIds]);

  // ========== 3) Lọc / sắp xếp / phân trang ==========
  const filteredPartners = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter((p) => {
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesSearch =
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.shopName || '').toLowerCase().includes(q) ||
        (p.shopAddress || '').toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [partners, search, typeFilter]);

  const sortedPartners = useMemo(() => {
    const arr = [...filteredPartners];
    if (sortBy === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortBy === 'rating') arr.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    if (sortBy === 'assignedRegions') {
      arr.sort((a, b) =>
        ((a.assignedRegions?.[0] || '')).localeCompare(b.assignedRegions?.[0] || '', 'vi', { sensitivity: 'base' })
      );
    }
    return arr;
  }, [filteredPartners, sortBy]);

  const paginatedPartners = useMemo(
    () => sortedPartners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sortedPartners, currentPage]
  );

  const totalPages = Math.ceil(sortedPartners.length / itemsPerPage);

  // ========== 4) Helpers hiển thị ==========
  const workingTimeText = (p: TechnicianPartner) => {
    const start = p.workingStartTime || '';
    const end = p.workingEndTime || '';
    return start && end ? `${start} – ${end}` : '-';
  };

  const formatCoords = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' ? `${lat}, ${lng}` : '-';

  const isLive = (ts?: Timestamp | null) => {
    if (!ts) return false;
    const now = Date.now();
    const t = ts.toMillis ? ts.toMillis() : new Date(ts as unknown as string).getTime();
    return now - t <= LIVE_TTL_MIN * 60 * 1000;
  };

  const resolveDisplayCoords = (p: TechnicianPartner) => {
    // Nếu mobile và users có vị trí → ưu tiên users
    if (p.type === 'mobile' && p.userId && userLocMap[p.userId]) {
      const u = userLocMap[p.userId];
      return {
        text: formatCoords(u.lat, u.lng),
        badge: isLive(u.lastSeenAt) ? 'LIVE' : 'USERS',
        live: isLive(u.lastSeenAt),
      };
    }
    // fallback: dùng coordinates của technicianPartners
    const c = p.coordinates;
    return {
      text: formatCoords(c?.lat, c?.lng),
      badge: p.type === 'mobile' ? 'TP' : '', // TP: from technicianPartners
      live: false,
    };
  };

  const handleExportXLSX = () => {
    const data = sortedPartners.map((p) => {
      const coord = resolveDisplayCoords(p);
      return {
        [t('technician_partner_table.export.name')]: p.name,
        [t('technician_partner_table.export.phone')]: p.phone,
        [t('technician_partner_table.export.email')]: p.email,
        [t('technician_partner_table.export.type')]: t(`technician_partner_table.type.${p.type}`),
        [t('technician_partner_table.export.shop_name')]: p.shopName || '',
        [t('technician_partner_table.export.shop_address')]: p.shopAddress || '',
        [t('technician_partner_table.export.map_address')]: p.mapAddress || '',
        [t('technician_partner_table.export.coordinates')]: coord.text,
        [t('technician_partner_table.export.assigned_regions')]: (p.assignedRegions || []).join(', '),
        [t('technician_partner_table.export.working_time')]: workingTimeText(p),
        [t('technician_partner_table.export.services')]: (p.serviceCategories || []).join(', '),
        [t('technician_partner_table.export.rating')]: p.averageRating ?? 'N/A',
        [t('technician_partner_table.export.active')]: p.isActive ? t('common_labels.yes') : t('common_labels.no'),
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('technician_partner_table.export.sheet_name'));
    XLSX.writeFile(workbook, 'technician_partners.xlsx', { bookType: 'xlsx' });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <SimpleSelect
            placeholder={t('technician_partner_table.filter_by_type')}
            options={[
              { label: t('common_labels.all'), value: 'all' },
              { label: t('technician_partner_table.type.shop'), value: 'shop' },
              { label: t('technician_partner_table.type.mobile'), value: 'mobile' },
            ]}
            value={typeFilter}
            onChange={(val: string) => setTypeFilter(val as 'all' | 'mobile' | 'shop')}
          />

          <SimpleSelect
            placeholder={t('technician_partner_table.sort_by')}
            options={[
              { label: t('technician_partner_table.sort.name'), value: 'name' },
              { label: t('technician_partner_table.sort.rating'), value: 'rating' },
              { label: t('technician_partner_table.sort.assigned_regions'), value: 'assignedRegions' },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as 'name' | 'rating' | 'assignedRegions')}
          />

          <Input
            placeholder={t('technician_partner_table.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button className="w-full" variant="outline" onClick={handleExportXLSX}>
            {t('technician_partner_table.export_excel')}
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {paginatedPartners.map((partner) => {
          const coord = resolveDisplayCoords(partner);
          return (
            <div key={partner.id} className="border rounded-xl p-4 shadow-sm space-y-2 text-sm bg-white">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-base">{partner.name}</div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    partner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {partner.isActive ? t('common_labels.active') : t('common_labels.inactive')}
                </span>
              </div>

              <div className="text-gray-700">{partner.phone}</div>
              <div className="text-gray-700">{partner.email || '-'}</div>
              <div className="text-gray-700">
                {t('technician_partner_table.col.type')}: {t(`technician_partner_table.type.${partner.type}`)}
              </div>

              {partner.type === 'shop' && (
                <>
                  <div>{t('technician_partner_table.col.shop_name')}: {partner.shopName || '-'}</div>
                  <div>{t('technician_partner_table.col.shop_address')}: {partner.shopAddress || '-'}</div>
                </>
              )}

              <div className="flex items-center gap-2">
                <span>{t('technician_partner_table.col.coordinates')}: {coord.text}</span>
                {coord.badge && (
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      coord.live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                    title={coord.live ? 'From users (LIVE <15m)' : 'From users'}
                  >
                    {coord.badge}
                  </span>
                )}
              </div>

              <div>{t('technician_partner_table.col.assigned_regions')}: {(partner.assignedRegions || []).join(', ') || '-'}</div>
              <div>{t('technician_partner_table.col.working_time')}: {workingTimeText(partner)}</div>
              <div>{t('technician_partner_table.col.service_categories')}: {(partner.serviceCategories || []).join(', ') || '-'}</div>
              <div>{t('technician_partner_table.col.rating')}: {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}</div>

              <div className="flex gap-2 justify-end pt-2">
                <Button size="sm" onClick={() => onEdit(partner)}>{t('common_actions.edit')}</Button>
                {onDelete && partner.id && (
                  <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>{t('common_actions.delete')}</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-600">
              <th className="p-3 text-left">{t('technician_partner_table.col.name')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.phone')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.email')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.type')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.shop_name')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.shop_address')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.coordinates')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.assigned_regions')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.working_time')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.service_categories')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.rating')}</th>
              <th className="p-3 text-left">{t('technician_partner_table.col.active')}</th>
              <th className="p-3 text-right">{t('common_actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPartners.map((partner) => {
              const coord = resolveDisplayCoords(partner);
              return (
                <tr key={partner.id} className="border-t">
                  <td className="p-3 font-medium">{partner.name}</td>
                  <td className="p-3">{partner.phone}</td>
                  <td className="p-3">{partner.email || '-'}</td>
                  <td className="p-3 capitalize">{t(`technician_partner_table.type.${partner.type}`)}</td>
                  <td className="p-3">{partner.shopName || '-'}</td>
                  <td className="p-3">{partner.shopAddress || '-'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{coord.text}</span>
                      {coord.badge && (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            coord.live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                          title={coord.live ? 'From users (LIVE <15m)' : 'From users'}
                        >
                          {coord.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{(partner.assignedRegions || []).join(', ') || '-'}</td>
                  <td className="p-3">{workingTimeText(partner)}</td>
                  <td className="p-3">{(partner.serviceCategories || []).join(', ') || '-'}</td>
                  <td className="p-3">{partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        partner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {partner.isActive ? t('common_labels.active') : t('common_labels.inactive')}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={() => onEdit(partner)}>{t('common_actions.edit')}</Button>
                      {onDelete && partner.id && (
                        <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>{t('common_actions.delete')}</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
