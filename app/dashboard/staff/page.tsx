'use client';

import { useState, useEffect } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import StaffForm from '@/src/components/staff/StaffForm';
import StaffSummaryCard from '@/src/components/staff/StaffSummaryCard';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { useStaffData } from '@/src/hooks/useStaffData';
import { Staff } from '@/src/lib/staff/staffTypes';
import { Button } from '@/src/components/ui/button';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { deleteInvitationMessage } from '@/src/lib/invitations/invitationService';
import ResponsiveStaffTable from '@/src/components/staff/ResponsiveStaffTable';
import { useTranslation } from 'react-i18next';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  name?: string;
  phone?: string;
  stationId?: string;
}

export default function StaffManagementPage() {
  const { t } = useTranslation('common');
  const { role, companyId, stationId, loading, user } = useUser();

  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isAssistant = normalizedRole === 'technician_assistant';

  // NEW: companyId được suy luận nếu context chưa có
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | undefined>(companyId);
  const [resolvingCompany, setResolvingCompany] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const resolveCompany = async () => {
      setResolvingCompany(true);
      try {
        // Admin & Assistant xem all -> không cần companyId
        if (isAdmin || isAssistant) {
          if (mounted) setResolvedCompanyId(undefined);
          return;
        }

        // Nếu context đã có companyId -> dùng luôn
        if (companyId) {
          if (mounted) setResolvedCompanyId(companyId);
          return;
        }

        // Nếu có stationId -> lấy companyId từ station
        if (stationId) {
          const st = await getDoc(doc(db, 'rentalStations', stationId));
          if (st.exists()) {
            const cid = (st.data() as any)?.companyId || '';
            if (mounted) setResolvedCompanyId(cid || undefined);
            if (cid) return;
          }
        }

        // Nếu là company_owner -> tìm rentalCompanies theo ownerId
        if (normalizedRole === 'company_owner' && user?.uid) {
          const rcSnap = await getDocs(
            query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
          );
          const cid = rcSnap.docs[0]?.id || '';
          if (mounted) setResolvedCompanyId(cid || undefined);
          if (cid) return;
        }

        // Các staff khác -> tìm trong collection 'staff' theo userId để lấy companyId
        if (user?.uid) {
          const staffSnap = await getDocs(
            query(collection(db, 'staff'), where('userId', '==', user.uid))
          );
          const cid = staffSnap.docs[0]?.data()?.companyId || '';
          if (mounted) setResolvedCompanyId(cid || undefined);
          return;
        }

        // Không xác định được
        if (mounted) setResolvedCompanyId(undefined);
      } finally {
        if (mounted) setResolvingCompany(false);
      }
    };

    resolveCompany();
    return () => {
      mounted = false;
    };
  }, [isAdmin, isAssistant, companyId, stationId, normalizedRole, user?.uid]);

  // Quyền xem: admin/assistant luôn OK; còn lại cần có companyId đã resolve
  const canViewStaff =
    isAdmin ||
    isAssistant ||
    (['company_owner', 'company_admin', 'station_manager'].includes(normalizedRole) &&
      !!resolvedCompanyId);

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as NotificationType,
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [stationMap, setStationMap] = useState<Record<string, string>>({});
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [refreshInvites, setRefreshInvites] = useState(false);

  // useStaffData: admin/assistant -> không truyền companyId (xem tất cả)
  const { staffs, loading: staffLoading, handleUpdate, handleDelete } = useStaffData({
    role: role ?? undefined,
    companyId: isAdmin || isAssistant ? undefined : resolvedCompanyId,
  });

  useEffect(() => {
    if (!loading && canViewStaff && !resolvingCompany) {
      if (isAdmin || isAssistant) {
        void loadAllCompanyNames();
        void loadAllStations();
      } else if (resolvedCompanyId) {
        void loadCompanyName(resolvedCompanyId);
        void loadStations(resolvedCompanyId);
        void loadPendingInvitations(resolvedCompanyId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin, isAssistant, canViewStaff, resolvingCompany, resolvedCompanyId, refreshInvites]);

  const loadCompanyName = async (id: string) => {
    const snap = await getDoc(doc(db, 'rentalCompanies', id));
    if (snap.exists()) setCompanyNames(prev => ({ ...prev, [id]: (snap.data() as any).name }));
  };

  const loadAllCompanyNames = async () => {
    const snapshot = await getDocs(collection(db, 'rentalCompanies'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(d => (map[d.id] = (d.data() as any).name));
    setCompanyNames(map);
  };

  const loadStations = async (cid: string) => {
    const snapshot = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', cid)));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(d => (map[d.id] = (d.data() as any).name));
    setStationMap(map);
  };

  const loadAllStations = async () => {
    const snapshot = await getDocs(collection(db, 'rentalStations'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(d => (map[d.id] = (d.data() as any).name));
    setStationMap(map);
  };

  const loadPendingInvitations = async (cid: string) => {
    const q = query(
      collection(db, 'messages'),
      where('companyId', '==', cid),
      where('type', '==', 'invitation'),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const invites = snap.docs.map(d => ({ ...(d.data() as Invitation), id: d.id }));
    setPendingInvites(invites);
  };

  const showDialog = (type: NotificationType, title: string, description = '', onConfirm?: () => void) => {
    setDialog({ open: true, type, title, description, onConfirm });
  };

  const confirmDeleteStaff = async (staff: Staff) => {
    try {
      await handleDelete(staff.id);
      showDialog('success', t('staff_management_page.success_delete_staff'));
    } catch (err) {
      console.error('Failed to delete staff:', err);
      showDialog('error', t('staff_management_page.error_delete_staff'));
    }
  };

  const confirmDeleteInvitation = async (invite: Invitation) => {
    try {
      await deleteInvitationMessage(invite.id);
      showDialog('success', t('staff_management_page.success_delete_invitation'));
      setRefreshInvites(prev => !prev);
    } catch (err) {
      console.error('Failed to delete invitation:', err);
      showDialog('error', t('staff_management_page.error_delete_invitation'));
    }
  };

  if (loading || resolvingCompany) {
    return <div className="text-center py-10">{t('staff_management_page.loading')}</div>;
  }

  if (!canViewStaff) {
    return <div className="text-center py-10 text-red-500">{t('staff_management_page.no_permission')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin || isAssistant
              ? t('staff_management_page.title_admin')
              : t('staff_management_page.title_company')}
          </h1>

          {/* Assistant không tạo/sửa xoá staff */}
          {!isAssistant && (
            <Button
              onClick={() => {
                setEditingStaff(null);
                setShowForm(true);
              }}
            >
              {t('staff_management_page.add_staff')}
            </Button>
          )}
        </div>

        <StaffSummaryCard staffs={staffs} />

        <ResponsiveStaffTable
          staffs={staffs}
          onEdit={(staff) => {
            if (isAssistant) return; // Assistant chỉ xem
            setEditingStaff(staff);
            setShowForm(true);
          }}
          onDelete={(staff) =>
            isAssistant
              ? undefined
              : showDialog(
                  'confirm',
                  t('staff_management_page.delete_staff_title'),
                  t('staff_management_page.delete_staff_confirm', { name: staff.name || (staff as any).email }),
                  () => confirmDeleteStaff(staff)
                )
          }
          stationMap={stationMap}
          companyNames={companyNames}
        />

        {showForm && !isAssistant && (
          <StaffForm
            editingStaff={editingStaff}
            companyId={resolvedCompanyId || ''} // dùng companyId đã resolve
            onSave={() => {
              setShowForm(false);
              setEditingStaff(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingStaff(null);
            }}
          />
        )}

        {pendingInvites.length > 0 && (
          <section className="pt-8">
            <h2 className="text-xl font-semibold mb-4">{t('staff_management_page.pending_invitations')}</h2>
            <ul className="space-y-3">
              {pendingInvites.map(invite => (
                <li key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-medium">{invite.name || invite.email}</p>
                    <p className="text-sm text-gray-500">{t('staff_management_page.role')}: {invite.role}</p>
                  </div>
                  {!isAssistant && (
                    <Button
                      variant="destructive"
                      onClick={() =>
                        showDialog(
                          'confirm',
                          t('staff_management_page.delete_invitation_title'),
                          t('staff_management_page.delete_invitation_confirm', { name: invite.name || invite.email }),
                          () => confirmDeleteInvitation(invite)
                        )
                      }
                    >
                      {t('staff_management_page.delete_invitation_button')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog(prev => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
