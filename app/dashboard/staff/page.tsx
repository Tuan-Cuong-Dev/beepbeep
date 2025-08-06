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
  const { role, companyId, loading, user } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const canViewStaff =
    isAdmin ||
    normalizedRole === 'technician_assistant' ||
    (['company_owner', 'company_admin'].includes(normalizedRole || '') && !!companyId);

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

  const { staffs, loading: staffLoading, handleUpdate, handleDelete } = useStaffData({
    role: role ?? undefined,
    companyId: companyId ?? undefined,
  });

  useEffect(() => {
    if (!loading && canViewStaff) {
      if (isAdmin || normalizedRole === 'technician_assistant') {
        loadAllCompanyNames();
        loadAllStations();
      } else if (companyId) {
        loadCompanyName(companyId);
        loadStations(companyId);
        loadPendingInvitations(companyId);
      }
    }
  }, [loading, companyId, isAdmin, canViewStaff, refreshInvites]);

  const loadCompanyName = async (id: string) => {
    const snap = await getDoc(doc(db, 'rentalCompanies', id));
    if (snap.exists()) setCompanyNames(prev => ({ ...prev, [id]: snap.data().name }));
  };

  const loadAllCompanyNames = async () => {
    const snapshot = await getDocs(collection(db, 'rentalCompanies'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(doc => (map[doc.id] = doc.data().name));
    setCompanyNames(map);
  };

  const loadStations = async (companyId: string) => {
    const snapshot = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', companyId)));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(doc => (map[doc.id] = doc.data().name));
    setStationMap(map);
  };

  const loadAllStations = async () => {
    const snapshot = await getDocs(collection(db, 'rentalStations'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach(doc => (map[doc.id] = doc.data().name));
    setStationMap(map);
  };

  const loadPendingInvitations = async (companyId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('companyId', '==', companyId),
      where('type', '==', 'invitation'),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const invites = snap.docs.map(doc => ({ ...(doc.data() as Invitation), id: doc.id }));
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

  if (loading) return <div className="text-center py-10">{t('staff_management_page.loading')}</div>;
  if (!canViewStaff) return <div className="text-center py-10 text-red-500">{t('staff_management_page.no_permission')}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? t('staff_management_page.title_admin') : t('staff_management_page.title_company')}
          </h1>

          {role !== 'technician_assistant' && (
            <Button onClick={() => {
              setEditingStaff(null);
              setShowForm(true);
            }}>
              {t('staff_management_page.add_staff')}
            </Button>
          )}
        </div>

        <StaffSummaryCard staffs={staffs} />

        <ResponsiveStaffTable
          staffs={staffs}
          onEdit={(staff) => {
            setEditingStaff(staff);
            setShowForm(true);
          }}
          onDelete={(staff) =>
            showDialog(
              'confirm',
              t('staff_management_page.delete_staff_title'),
              t('staff_management_page.delete_staff_confirm', { name: staff.name || staff.email }),
              () => confirmDeleteStaff(staff)
            )
          }
          stationMap={stationMap}
          companyNames={companyNames}
        />

        {showForm && (
          <StaffForm
            editingStaff={editingStaff}
            companyId={companyId || ''}
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
