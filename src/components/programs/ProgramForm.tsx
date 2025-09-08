// Rental Companies và Private Provider tạo Các chương trình khuyến mãi
// 08/09/2025

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/src/firebaseConfig';
import {
  addDoc, collection, doc, getDoc, getDocs, query, where,
  updateDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Switch } from '@/src/components/ui/switch'; // nếu đã có

export default function ProgramForm() {
  const { user, role } = useUser() as any; // role: 'company_owner' | 'private_provider' | 'Admin' ...
  const router = useRouter();
  const params = useParams();
  const programId = params?.id as string | undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateStr, setStartDateStr] = useState(''); // yyyy-MM-dd
  const [endDateStr, setEndDateStr] = useState('');
  const [isActive, setIsActive] = useState(true);

  // placeholders — TODO: build proper pickers
  const [modelDiscounts] = useState<any[]>([]);
  const [stationTargets] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toDateStr = (ts?: Timestamp | null) =>
    ts?.toDate ? ts.toDate().toISOString().slice(0, 10) : '';

  const toTimestamp = (dateStr: string) =>
    dateStr ? Timestamp.fromDate(new Date(dateStr + 'T00:00:00')) : null;

  useEffect(() => {
    if (!programId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'programs', programId));
      if (!snap.exists()) return;
      const d = snap.data() as any;
      setTitle(d.title ?? d.name ?? '');
      setDescription(d.description ?? '');
      setStartDateStr(toDateStr(d.startDate ?? null));
      setEndDateStr(toDateStr(d.endDate ?? null));
      setIsActive(d.isActive ?? true);
      // optional: set modelDiscounts/stationTargets if UI có
    })();
  }, [programId]);

  const fetchCompanyId = async (uid: string) => {
    // ưu tiên rentalCompanies, nếu không có thì thử privateProviders
    const q1 = query(collection(db, 'rentalCompanies'), where('ownerId', '==', uid));
    const s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0].id;

    const q2 = query(collection(db, 'privateProviders'), where('ownerId', '==', uid));
    const s2 = await getDocs(q2);
    if (!s2.empty) return s2.docs[0].id;

    return null;
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!startDateStr || !endDateStr) return 'Start and end dates are required';
    if (new Date(endDateStr) < new Date(startDateStr)) return 'End date must be after start date';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) { setErr(v); return; }
    if (!user?.uid) { setErr('Please sign in'); return; }

    setLoading(true);
    try {
      const companyId = await fetchCompanyId(user.uid);

      const payload = {
        // ——— Program fields (khớp type)
        title,
        description,
        type: 'rental_program' as const,
        createdByUserId: user.uid,
        createdByRole: (role ?? 'company_owner'),
        companyId, // có thể null nếu không tìm thấy
        stationTargets,
        modelDiscounts,
        startDate: toTimestamp(startDateStr),
        endDate: toTimestamp(endDateStr),
        isActive,
        updatedAt: serverTimestamp(),
      };

      if (programId) {
        await updateDoc(doc(db, 'programs', programId), payload);
      } else {
        await addDoc(collection(db, 'programs'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      router.push('/dashboard/programs');
    } catch (e: any) {
      setErr(e?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {programId ? 'Edit Program' : 'New Program'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <Input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <Input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm text-gray-700">Active</span>
          </div>

          {/* TODO: Model Discounts & Station Targets pickers */}
          {/* <ModelDiscountEditor value={modelDiscounts} onChange={setModelDiscounts} /> */}
          {/* <StationTargetPicker value={stationTargets} onChange={setStationTargets} companyId={companyId} /> */}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Program'}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
