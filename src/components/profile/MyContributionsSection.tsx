'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { useContributions } from '@/src/hooks/useContributions';
import { Contribution as ContributionDoc } from '@/src/lib/contributions/contributionTypes';
import { format } from 'date-fns';
import { useTranslation, Trans } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs';
import { Button } from '@/src/components/ui/button';
import ContributionPointsSummary from '@/src/components/contribute/contributions/ContributionPointsSummary';
import EditContributionModal from '@/src/components/contribute/edit/EditContributionModal';

interface MappedContribution {
  id: string;
  type: 'repair_shop' | 'rental_shop' | 'battery_station';
  name: string;
  address: string;
  createdAt: Timestamp | null;
  status: 'approved' | 'pending';
}

const ITEMS_PER_PAGE = 5;

export default function MyContributionsSection() {
  const { currentUser } = useAuth();
  const { getMyContributions } = useContributions();
  const { t } = useTranslation('common');

  const [contributions, setContributions] = useState<MappedContribution[]>([]);
  const [pointHistory, setPointHistory] = useState<ContributionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsLoading, setPointsLoading] = useState(true);

  const [editing, setEditing] = useState<MappedContribution | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchContributions = async () => {
      setLoading(true);
      const all: MappedContribution[] = [];

      const fetchData = async (
        col: string,
        type: MappedContribution['type'],
        mapData: (d: any) => Partial<MappedContribution>
      ) => {
        const q = query(collection(db, col), where('createdBy', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const data = mapData(doc.data());
          all.push({
            id: doc.id,
            type,
            name: data.name ?? '—',
            address: data.address ?? '—',
            createdAt: data.createdAt ?? null,
            status: data.status ?? 'pending',
          });
        });
      };

      await fetchData('technicianPartners', 'repair_shop', (d) => ({
        name: d.shopName || d.name,
        // Ưu tiên schema mới, fallback legacy/khác
        address:
          d?.location?.address ||
          d?.location?.mapAddress ||
          d?.location?.location || // "lat,lng" nếu chưa có address text
          d?.shopAddress ||        // legacy field
          '',
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));


      await fetchData('rentalStations', 'rental_shop', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: 'pending',
      }));

      await fetchData('batteryStations', 'battery_station', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      setContributions(
        all.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setLoading(false);
    };

    const fetchPoints = async () => {
      setPointsLoading(true);
      const data = await getMyContributions();
      setPointHistory(data);
      setPointsLoading(false);
    };

    fetchContributions();
    fetchPoints();
  }, [currentUser]);

  const getStatusLabel = (status: MappedContribution['status']) =>
    status === 'approved'
      ? t('my_contributions_section.status.approved')
      : t('my_contributions_section.status.pending');

  const getStatusColor = (status: MappedContribution['status']) =>
    status === 'approved' ? 'text-green-600' : 'text-yellow-600';

  const openEditModal = (item: MappedContribution) => {
    setEditing(item);
    setModalOpen(true);
  };

  const totalContribPages = Math.ceil(contributions.length / ITEMS_PER_PAGE);
  const paginatedContributions = contributions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPointPages = Math.ceil(pointHistory.length / ITEMS_PER_PAGE);
  const paginatedPoints = pointHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Tabs defaultValue="contributions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contributions">🗺 {t('my_contributions_section.tabs.contributions')}</TabsTrigger>
          <TabsTrigger value="points">🏆 {t('my_contributions_section.tabs.points')}</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions">
          {loading ? (
            <p className="p-4">{t('profiles_page_content.loading')}</p>
          ) : contributions.length === 0 ? (
            <p className="p-4">{t('profiles_page_content.no_contributions')}</p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedContributions.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '—'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{item.address}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {t('my_contributions_section.status_label')}{' '}
                        <span className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</span>
                      </p>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                        {t('my_contributions_section.edit')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-4 space-x-2 text-sm">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {t('my_contributions_section.previous')}
                </button>
                <span className="px-3 py-1 border rounded text-gray-600">
                  {t('my_contributions_section.page')} {currentPage} / {totalContribPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalContribPages))}
                  disabled={currentPage === totalContribPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {t('my_contributions_section.next')}
                </button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="points">
          <ContributionPointsSummary />
          {pointsLoading ? (
            <p className="text-sm text-gray-500">{t('contribution_points_section.loading')}</p>
          ) : pointHistory.length === 0 ? (
            <p className="text-sm text-gray-500">{t('contribution_points_section.no_records')}</p>
          ) : (
            <div className="bg-white shadow rounded p-4 border mt-4">
              <h3 className="text-lg font-bold mb-4">{t('contribution_points_section.title')}</h3>
              <ul className="divide-y divide-gray-200">
                {paginatedPoints.map((c) => {
                  const humanize = (s: string) =>
                    s?.toString().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

                  const typeKey = `contribution_types.${(c.type || '').toLowerCase()}`;
                  const statusKey = `contribution_statuses.${(c.status || '').toLowerCase()}`;

                  const typeLabel = t(typeKey, { defaultValue: humanize(c.type) });
                  const statusLabel = t(statusKey, { defaultValue: humanize(c.status) });

                  return (
                    <li key={c.id} className="py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium capitalize">
                            {t('contribution_points_section.type', { type: typeLabel })}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Trans
                              t={t}
                              i18nKey="contribution_points_section.status"
                              values={{ status: statusLabel }}
                              components={{ strong: <strong className="capitalize" /> }}
                            />
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(c.createdAt.toDate(), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-center mt-4 space-x-2 text-sm">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {t('my_contributions_section.previous')}
                </button>
                <span className="px-3 py-1 border rounded text-gray-600">
                  {t('my_contributions_section.page')} {currentPage} / {totalPointPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPointPages))}
                  disabled={currentPage === totalPointPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {t('my_contributions_section.next')}
                </button>
              </div>
            </div>
          )}
        </TabsContent>

      </Tabs>

      <EditContributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contribution={editing}
      />
    </>
  );
}

export interface Contribution {
  id: string;
  type: 'repair_shop' | 'rental_shop' | 'battery_station' | 'battery_charging_station';
  [key: string]: any;
}
