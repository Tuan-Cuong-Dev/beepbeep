'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import ReportIssueForm from '@/src/components/vehicle-issues/ReportIssueForm';
import { useCompanyAndStation } from '@/src/hooks/useCompanyAndStation';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

/** ──────────────────────────────────────────────────────────
 *  Inline picker cho Admin/Technician Assistant (nếu cần)
 *  ────────────────────────────────────────────────────────── */
function CompanyStationPicker({
  onPicked,
  disabled,
}: {
  onPicked: (companyId: string, companyName: string, stationId?: string, stationName?: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('common');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [stations, setStations] = useState<Array<{ id: string; name: string }>>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [stationId, setStationId] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const snap = await getDocs(collection(db, 'rentalCompanies'));
      const list = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id }));
      if (mounted) {
        setCompanies(list);
        if (list[0]) setCompanyId(list[0].id);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!companyId) { setStations([]); setStationId(''); return; }
      const q = query(collection(db, 'rentalStations'), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id }));
      if (mounted) {
        setStations(list);
        setStationId(list[0]?.id || '');
      }
    })();
    return () => { mounted = false; };
  }, [companyId]);

  const companyName = useMemo(() => companies.find(c => c.id === companyId)?.name || '', [companies, companyId]);
  const stationName = useMemo(() => stations.find(s => s.id === stationId)?.name || '', [stations, stationId]);

  return (
    <div className="rounded-xl border p-4 md:p-6 bg-white space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('report_issue_client.pick_company')}</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={companyId}
            disabled={disabled}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('report_issue_client.pick_station_optional')}</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={stationId}
            disabled={disabled || stations.length === 0}
            onChange={(e) => setStationId(e.target.value)}
          >
            <option value="">{t('report_issue_client.any_station')}</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-lg bg-[#00d289] text-white font-medium disabled:opacity-60"
          disabled={disabled || !companyId}
          onClick={() => onPicked(companyId, companyName, stationId || undefined, stationName || undefined)}
        >
          {t('report_issue_client.start_reporting')}
        </button>
      </div>
    </div>
  );
}

export default function ReportIssueClient() {
  const { t } = useTranslation('common');
  const { role, user } = useUser();
  const normalizedRole = (role || '').toLowerCase();

  const { companyId, companyName, stationId, stationName, loading } = useCompanyAndStation();
  const [notification, setNotification] = useState<string | null>(null);

  // Cho phép Admin/Technician Assistant chọn thủ công
  const isGlobalRole = normalizedRole === 'admin' || normalizedRole === 'technician_assistant';

  // ✅ Fallback tự resolve cho company_owner / station_manager nếu hook chưa có companyId
  const [resolved, setResolved] = useState<{
    companyId?: string;
    companyName?: string;
  }>({});
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) return;

      // company_owner: tìm rentalCompanies theo ownerId
      if (!companyId && normalizedRole === 'company_owner') {
        const rcSnap = await getDocs(
          query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
        );
        const cid = rcSnap.docs[0]?.id;
        if (cid && mounted) {
          const rc = await getDoc(doc(db, 'rentalCompanies', cid));
          const cname = rc.exists() ? ((rc.data() as any).name as string) || cid : cid;
          setResolved({ companyId: cid, companyName: cname });
          return;
        }
        // Dự phòng: tìm companyId từ bảng staff
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('userId', '==', user.uid))
        );
        const staffCid = staffSnap.docs[0]?.data()?.companyId as string | undefined;
        if (staffCid && mounted) {
          const rc = await getDoc(doc(db, 'rentalCompanies', staffCid));
          const cname = rc.exists() ? ((rc.data() as any).name as string) || staffCid : staffCid;
          setResolved({ companyId: staffCid, companyName: cname });
          return;
        }
      }

      // station_manager: nếu có stationId nhưng hook chưa trả companyId → lấy từ station
      if (!companyId && normalizedRole === 'station_manager' && stationId) {
        const st = await getDoc(doc(db, 'rentalStations', stationId));
        const cid = st.exists() ? (st.data() as any)?.companyId as string | undefined : undefined;
        if (cid && mounted) {
          const rc = await getDoc(doc(db, 'rentalCompanies', cid));
          const cname = rc.exists() ? ((rc.data() as any).name as string) || cid : cid;
          setResolved({ companyId: cid, companyName: cname });
        }
      }
    })();
    return () => { mounted = false; };
  }, [user?.uid, normalizedRole, companyId, stationId]);

  // Admin/Assistant có thể “pick”
  const [picked, setPicked] = useState<{
    companyId?: string;
    companyName?: string;
    stationId?: string;
    stationName?: string;
  }>({});

  // Company context hiệu lực từ 3 nguồn: picked (admin) → hook → resolved (fallback)
  const effectiveCompanyId = picked.companyId || companyId || resolved.companyId;
  const effectiveCompanyName = picked.companyName || companyName || resolved.companyName || '';
  const effectiveStationId = picked.stationId ?? stationId ?? '';
  const effectiveStationName = picked.stationName || stationName || '';

  if (loading) {
    return <div className="text-center py-10">{t('report_issue_client.loading')}</div>;
  }

  // Company roles mà vẫn chưa có companyId sau khi fallback → thông báo đúng logic
  const isCompanyRole = ['company_owner', 'company_admin', 'station_manager', 'technician'].includes(normalizedRole);
  if (isCompanyRole && !effectiveCompanyId && !isGlobalRole) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-4 max-w-3xl mx-auto flex flex-col justify-center items-center text-gray-600 space-y-4 text-center">
          <h1 className="text-2xl font-semibold">🚫 {t('report_issue_client.title')}</h1>
          <p>{t('report_issue_client.missing_company')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-1 py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">🚨 {t('report_issue_client.heading')}</h1>

        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Admin/Assistant: nếu chưa có companyId thì cho chọn */}
          {isGlobalRole && !effectiveCompanyId && (
            <CompanyStationPicker
              onPicked={(cid, cname, sid, sname) =>
                setPicked({ companyId: cid, companyName: cname, stationId: sid, stationName: sname })
              }
            />
          )}

          {/* Chỉ render form khi đã có companyId hợp lệ */}
          {effectiveCompanyId && (
            <div className="bg-white rounded-2xl border p-4 sm:p-6 md:p-10 space-y-8 shadow">
              <div className="text-sm text-gray-600">
                <div><span className="font-medium">{t('report_issue_client.company')}:</span> {effectiveCompanyName}</div>
                {effectiveStationId && (
                  <div><span className="font-medium">{t('report_issue_client.station')}:</span> {effectiveStationName}</div>
                )}
              </div>

              <ReportIssueForm
                companyId={effectiveCompanyId}
                companyName={effectiveCompanyName}
                stationId={effectiveStationId}
                stationName={effectiveStationName}
                onReported={() => setNotification(t('report_issue_client.success'))}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={!!notification}
        type="success"
        title={t('report_issue_client.success_title')}
        description={notification || undefined}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
