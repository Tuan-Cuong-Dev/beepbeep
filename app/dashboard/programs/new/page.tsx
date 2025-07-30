'use client';

import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { SimpleSelect } from '@/src/components/ui/select';
import { stringToTimestamp } from '@/src/utils/date';
import { ProgramType } from '@/src/lib/programs/programsType';

export default function ProgramsFormPage() {
  const { user, role, companyId } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [selectedModelDiscounts, setSelectedModelDiscounts] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === 'Admin';
  const isCompanyRole = role === 'company_owner' || role === 'private_provider';

  // Fetch Companies nếu là Admin
  useEffect(() => {
    if (isAdmin) {
      getDocs(collection(db, 'rentalCompanies')).then(snapshot => {
        const companiesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCompanies(companiesList);
      });
    } else if (isCompanyRole) {
      setSelectedCompanyId(companyId ?? null);
    }
  }, [isAdmin, isCompanyRole, companyId]);

  // Fetch Stations + Models khi có Company
  useEffect(() => {
    if (!selectedCompanyId) return;

    getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', selectedCompanyId))).then(snapshot => {
      const stationsList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setStations(stationsList);
    });

    getDocs(query(collection(db, 'ebikeModels'), where('companyId', '==', selectedCompanyId))).then(snapshot => {
      const modelsList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setModels(modelsList);
    });
  }, [selectedCompanyId]);

  const handleSubmit = async () => {
    if (!title || !description || !selectedCompanyId || Object.keys(selectedModelDiscounts).length === 0) {
      setNotification({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const programType: ProgramType = isCompanyRole ? 'rental_program' : 'agent_program';

      await addDoc(collection(db, 'programs'), {
        title,
        description,
        type: programType,
        companyId: selectedCompanyId,
        stationIds: selectedStationIds,
        modelDiscounts: selectedModelDiscounts,
        startDate: stringToTimestamp(startDate),
        endDate: stringToTimestamp(endDate),
        createdByUserId: user?.uid,
        createdByRole: (role || '').toLowerCase(),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotification({ type: 'success', message: 'Program created successfully!' });
      setTimeout(() => router.push('/dashboard/programs'), 1000);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error saving program.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStation = (stationId: string) => {
    setSelectedStationIds(prev =>
      prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
    );
  };

  return (
    <>
      <Header />

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create Program</h1>

        {isAdmin && (
          <SimpleSelect
            options={companies.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select Company"
            value={selectedCompanyId ?? ''}
            onChange={(val) => setSelectedCompanyId(val)}
          />
        )}

        <Input placeholder="Program Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        {stations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Select Stations (optional)</h3>
            <div className="grid grid-cols-2 gap-2">
              {stations.map(station => (
                <Button
                  variant={selectedStationIds.includes(station.id) ? "default" : "outline"}
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                >
                  {station.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {models.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Set Discount Price per Model</h3>
            {models.map(model => (
              <div key={model.id} className="flex gap-2 items-center mb-2">
                <div className="w-1/3">{model.name}</div>
                <Input
                  placeholder="Discount Price (VND)"
                  value={selectedModelDiscounts[model.id] ?? ''}
                  onChange={(e) =>
                    setSelectedModelDiscounts(prev => ({ ...prev, [model.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Submit Program'}
        </Button>
      </div>

      <Footer />

      {notification && (
        <NotificationDialog
          open={true}
          type={notification.type}
          title={notification.type === 'success' ? 'Success' : 'Error'}
          description={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
