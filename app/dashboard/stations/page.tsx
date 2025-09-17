'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import CreateStationForm from '@/src/components/rental-stations/CreateStationForm';
import EditStationForm from '@/src/components/rental-stations/EditStationForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useCurrentCompanyId } from '@/src/hooks/useCurrentCompanyId';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function StationManagementPage() {
  const { t } = useTranslation('common');
  const { companyId, loading } = useCurrentCompanyId();
  const [stations, setStations] = useState<RentalStation[]>([]);
  const [editingStation, setEditingStation] = useState<RentalStation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  const fetchStations = useCallback(async () => {
    if (!companyId) return;
    setRefreshing(true);
    try {
      const q = query(collection(db, 'rentalStations'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      const result: RentalStation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RentalStation, 'id'>),
      }));
      setStations(result);
    } catch (err) {
      console.error('❌ Failed to load stations:', err);
      showDialog('error', t('station_management_page.load_failed'));
    } finally {
      setRefreshing(false);
    }
  }, [companyId, t]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rentalStations', id));
      showDialog('success', t('station_management_page.delete'), t('station_management_page.delete_success'));
      await fetchStations();
    } catch (err) {
      console.error('❌ Failed to delete station:', err);
      showDialog('error', t('station_management_page.delete'), t('station_management_page.delete_failed'));
    } finally {
      setConfirmDeleteId(null);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/Cover_desktop.jpg')" }}
    >
      <Header />

      <main className="flex-1 px-4 py-24 flex justify-center">
        <div className="w-full max-w-5xl bg-white bg-opacity-90 rounded-3xl shadow-2xl p-10 border border-gray-200 space-y-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">{t('station_management_page.title')}</h1>
            <div className="w-16 h-[3px] bg-[#00d289] mx-auto mt-2 mb-4 rounded-full" />
            <p className="text-sm text-gray-600">{t('station_management_page.subtitle')}</p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">{t('station_management_page.loading_company')}</p>
          ) : companyId ? (
            <>
              {editingStation ? (
                <EditStationForm
                  companyId={companyId}
                  editingStation={editingStation}
                  onCancel={() => setEditingStation(null)}
                  onSaved={() => {
                    setEditingStation(null);
                    fetchStations();
                  }}
                />
              ) : (
                <CreateStationForm companyId={companyId} onCreated={fetchStations} />
              )}

              <div className="pt-6 border-t border-gray-300 space-y-4">
                {/* Header + Search (mobile-first) */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center justify-between md:justify-start md:gap-3">
                    <h2 className="text-lg font-semibold">
                      {t('station_management_page.existing_stations')}
                    </h2>
                    {/* Count badge (ẩn trên md vì không cần) */}
                    <span className="md:hidden inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      {filteredStations.length}
                    </span>
                  </div>

                  {/* Search input — full width on mobile, fixed width on md+ */}
                  <div className="relative w-full md:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔎</span>
                    <Input
                      type="text"
                      placeholder={t('station_management_page.search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {refreshing ? (
                  // Refreshing skeleton
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse">
                        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-3/4 bg-gray-200 rounded mb-1.5" />
                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                        <div className="mt-3 h-8 w-full bg-gray-100 rounded md:hidden" />
                      </div>
                    ))}
                    <p className="text-sm text-gray-500">{t('station_management_page.refreshing')}</p>
                  </div>
                ) : filteredStations.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center gap-2 py-10 bg-white border border-dashed border-gray-300 rounded-xl">
                    <div className="text-3xl">🗺️</div>
                    <p className="text-sm text-gray-600">{t('station_management_page.no_result')}</p>
                  </div>
                ) : (
                  // List
                  <ul className="space-y-3">
                    {filteredStations.map((station) => (
                      <li
                        key={station.id}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          {/* Info */}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{station.name}</p>
                            <p className="text-gray-700 mt-0.5">{station.displayAddress}</p>
                            <p className="text-gray-500 text-xs mt-1">📍 {station.location}</p>
                          </div>

                          {/* Actions */}
                          <div className="hidden md:flex items-center gap-2">
                            <Button variant="outline" onClick={() => setEditingStation(station)}>
                              {t('station_management_page.edit')}
                            </Button>
                            <Button variant="destructive" onClick={() => setConfirmDeleteId(station.id)}>
                              {t('station_management_page.delete')}
                            </Button>
                          </div>
                        </div>

                        {/* Mobile action bar */}
                        <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
                          <Button variant="outline" className="w-full" onClick={() => setEditingStation(station)}>
                            ✏️ {t('station_management_page.edit')}
                          </Button>
                          <Button variant="destructive" className="w-full" onClick={() => setConfirmDeleteId(station.id)}>
                            🗑️ {t('station_management_page.delete')}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </>
          ) : (
            <p className="text-center   text-red-600">{t('station_management_page.no_company')}</p>
          )}
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />

      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-800">{t('station_management_page.confirm_delete_title')}</h2>
            <p className="text-sm text-gray-600">{t('station_management_page.confirm_delete_message')}</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                {t('station_management_page.cancel')}
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(confirmDeleteId)}>
                {t('station_management_page.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
