'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import CreateStationForm from '@/src/components/stations/CreateStationForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useCurrentCompanyId } from '@/src/hooks/useCurrentCompanyId';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import EditStationForm from '@/src/components/stations/EditStationForm';

interface Station {
  id: string;
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
}

export default function StationManagementPage() {
  const { companyId, loading } = useCurrentCompanyId();
  const [stations, setStations] = useState<Station[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
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
      const list: Station[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Station, 'id'>),
      }));
      setStations(list);
      showDialog('success', 'Success', 'Stations loaded successfully.');
    } catch (err) {
      console.error('❌ Failed to load stations:', err);
      showDialog('error', 'Load Failed', 'Could not load stations. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/Cover2.jpg')" }}
    >
      <Header />

      <main className="flex-1 px-4 py-24 flex justify-center">
        <div className="w-full max-w-5xl bg-white bg-opacity-90 rounded-3xl shadow-2xl p-10 border border-gray-200 space-y-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Rental Stations</h1>
            <div className="w-16 h-[3px] bg-[#00d289] mx-auto mt-2 mb-4 rounded-full" />
            <p className="text-sm text-gray-600">Manage and view your stations linked to the company.</p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">🔄 Loading company info...</p>
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
                <h2 className="text-lg font-semibold">📍 Existing Stations</h2>

                {refreshing ? (
                  <p className="text-sm text-gray-500">🔄 Refreshing station list...</p>
                ) : stations.length === 0 ? (
                  <p className="text-sm text-gray-500">No stations created yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {stations.map((station) => (
                      <li
                        key={station.id}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{station.name}</p>
                            <p className="text-gray-700">{station.displayAddress}</p>
                            <p className="text-gray-600 text-xs mt-1">📍 {station.location}</p>
                          </div>
                          <Button variant="outline" onClick={() => setEditingStation(station)}>
                            Edit
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {stations.length > 0 && (
                <div className="pt-10 border-t border-gray-300 space-y-4">
                  <Link href="/ebikeManagement">
                    <Button className="bg-[#00d289] hover:bg-[#00b67a] text-white rounded px-6 py-2 shadow-md">
                      Add Model
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-red-600">❌ No company linked to this account.</p>
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
    </div>
  );
}
