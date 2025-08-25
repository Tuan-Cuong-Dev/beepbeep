'use client';

// Quản trị các sự cố đang ở trạng thái "proposed" (đã có đề xuất)
// Trang này dành cho admin / technician_assistant để xem, duyệt hoặc từ chối đề xuất

import { useEffect, useMemo, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { Button } from '@/src/components/ui/button';
import PublicIssuesSearchFilter from '@/src/components/public-vehicle-issues/PublicIssueSearchFilter';
import VehicleIssuesSummaryCard from '@/src/components/public-vehicle-issues/PublicIssueSummaryCard';
import ViewProposalDialog from '@/src/components/public-vehicle-issues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/public-vehicle-issues/ApproveProposalDialog';

import { useUser } from '@/src/context/AuthContext';
import { usePublicIssuesToDispatch } from '@/src/hooks/usePublicIssuesToDispatch';
import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { formatCurrency } from '@/src/utils/formatCurrency';

function safe(v?: string | number | null) {
  return v !== null && v !== undefined && v !== '' ? v : '-';
}
function fmt(d?: any) {
  return d?.toDate ? format(d.toDate(), 'Pp') : '-';
}
function fmtMoney(v?: number | string | null) {
  return v === null || v === undefined || v === '' ? '-' : formatCurrency(v);
}
function getCoordString(loc?: any): string {
  if (!loc) return '';
  if (typeof loc.coordinates === 'string' && loc.coordinates.trim()) return loc.coordinates.trim();
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') return `${loc.lat},${loc.lng}`;
  return '';
}
function mapsHref(coordStr: string) {
  return coordStr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordStr)}` : '';
}

export default function ProposedManagementPage() {
  const { t } = useTranslation('common', { keyPrefix: 'public_issue_proposed_page' });

  const { role, user, loading: userLoading } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isTechAssistant = normalizedRole === 'technician_assistant';
  const isTechnicianPartner = normalizedRole === 'technician_partner';

  const canView = isAdmin || isTechAssistant || isTechnicianPartner;
  const canApproveReject = isAdmin || isTechAssistant;

  const { issues, loading, fetchVehicleIssues, updateIssue } = usePublicIssuesToDispatch();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const [viewingProposal, setViewingProposal] = useState<PublicVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<PublicVehicleIssue | null>(null);

  useEffect(() => {
    if (dialog.open) {
      const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 2500);
      return () => clearTimeout(timer);
    }
  }, [dialog.open]);

  const scopedIssues = useMemo(() => {
    const base = issues.filter((i) => i.status === 'proposed');
    if (isTechnicianPartner) {
      const uid = user?.uid;
      return base.filter((i) => i.assignedTo === uid);
    }
    return base;
  }, [issues, isTechnicianPartner, user?.uid]);

  const filteredIssues = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const matchStr = (s?: string) => (s || '').toLowerCase().includes(q);

    return scopedIssues.filter((i) => {
      const approve = i.approveStatus ?? 'pending';
      const okApprove = statusFilter === 'All' ? true : approve === statusFilter;

      const okSearch = q
        ? [
            i.customerName,
            i.phone,
            i.vehicleBrand,
            i.vehicleModel,
            i.vehicleLicensePlate,
            i.issueDescription,
            i.proposedSolution,
            (i as any).assignedToName,
            i.location?.mapAddress,
            i.location?.issueAddress,
            typeof i.location?.coordinates === 'string'
              ? i.location?.coordinates
              : JSON.stringify(i.location?.coordinates ?? ''),
          ].some((x) => matchStr(String(x ?? '')))
        : true;

      return okApprove && okSearch;
    });
  }, [scopedIssues, searchTerm, statusFilter]);

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  const handleApprove = async (issue: PublicVehicleIssue) => {
    try {
      await updateIssue(issue.id as string, {
        approveStatus: 'approved',
        status: 'confirmed',
        updatedAt: serverTimestamp() as any,
      });
      showDialog('success', t('messages.approve_success'));
      await fetchVehicleIssues();
    } catch {
      showDialog('error', t('messages.approve_failed'));
    }
  };

  const handleReject = async (issue: PublicVehicleIssue, reason: string) => {
    try {
      await updateIssue(issue.id as string, {
        approveStatus: 'rejected',
        status: 'rejected',
        closeComment: reason,
        updatedAt: serverTimestamp() as any,
      });
      showDialog('success', t('messages.reject_success'));
      await fetchVehicleIssues();
    } catch {
      showDialog('error', t('messages.reject_failed'));
    }
  };

  if (loading || userLoading) return <div className="py-10 text-center">{t('loading')}</div>;
  if (!canView) return <div className="py-10 text-center text-red-500">{t('no_permission')}</div>;

  const Empty = (
    <div className="p-10 text-center text-sm text-gray-500">{t('empty')}</div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <UserTopMenu />

      <main className="flex-1 space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">{t('title')}</h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        <VehicleIssuesSummaryCard issues={scopedIssues} />

        <PublicIssuesSearchFilter
          mode="approve"
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

                {/* Bảng đề xuất — Desktop */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr className="*:[&>th]:px-3 *:[&>th]:py-2 *:[&>th]:font-semibold *:[&>th]:text-left">
                    <th className="sticky left-0 z-10 rounded-tl-2xl bg-gray-50">{t('customer', 'Customer')}</th>
                    <th>{t('phone', 'Phone')}</th>
                    <th>{t('plate', 'Plate')}</th>
                    <th>{t('brand', 'Brand')}</th>
                    <th>{t('model', 'Model')}</th>
                    <th className="w-[220px]">{t('issue_description', 'Issue')}</th>
                    <th className="w-[260px]">{t('address', 'Address')}</th>
                    <th>{t('assigned_to', 'Assigned To')}</th>
                    <th className="w-[220px]">{t('proposed_solution', 'Proposed')}</th>
                    <th className="w-[120px]">{t('proposed_cost', 'Proposed Cost')}</th>
                    <th>{t('status', 'Status')}</th>
                    <th>{t('reported', 'Reported')}</th>
                    <th>{t('updated', 'Updated')}</th>
                    <th className="sticky right-2 z-10 w-[220px] rounded-tr-2xl bg-gray-50">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIssues.length === 0 && (
                    <tr>
                      <td colSpan={14}>{Empty}</td>
                    </tr>
                  )}

                  {filteredIssues.map((issue, idx) => (
                    <tr key={issue.id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {/* Fixed first cell for easy reading while scrolling */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-3 font-medium text-gray-800">
                        <div>{safe(issue.customerName)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{safe(issue.phone)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{safe(issue.vehicleLicensePlate)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{safe(issue.vehicleBrand)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{safe(issue.vehicleModel)}</td>
                      <td className="px-3 py-3">
                        <div className="max-w-[220px] truncate text-red-500">{safe(issue.issueDescription)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[260px] truncate">{safe(issue.location?.issueAddress)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[180px] truncate">{safe(issue.assignedToName)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[220px] truncate">{safe(issue.proposedSolution)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{fmtMoney(issue.proposedCost)}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          {(issue.approveStatus ?? 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{fmt(issue.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{fmt(issue.updatedAt)}</td>
                      {/* Fixed action column on the right */}
                      <td className="sticky right-2 z-10 w-[220px] bg-inherit px-3 py-3 align-top">
                        <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
                          <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                            {t('view', 'View')}
                          </Button>
                          {canApproveReject && (
                            <Button size="sm" onClick={() => setApprovingProposal(issue)}>
                              {t('review', 'Review')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 lg:hidden">
            {filteredIssues.length === 0 && Empty}
            {filteredIssues.map((issue) => {
              const coordStr = getCoordString(issue.location);
              return (
                <div key={issue.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{safe(issue.customerName)}</div>
                      <div className="mt-1">
                        {issue.phone ? (
                          <a
                            href={`tel:${issue.phone}`}
                            className="text-base font-semibold text-blue-600 underline decoration-dotted underline-offset-2"
                          >
                            {safe(issue.phone)}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      {(issue.approveStatus ?? 'pending').toUpperCase()}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">{t('plate', 'Plate')}</dt>
                      <dd className="font-medium">{safe(issue.vehicleLicensePlate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('brand', 'Brand')}</dt>
                      <dd className="font-medium">{safe(issue.vehicleBrand)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('model', 'Model')}</dt>
                      <dd className="font-medium">{safe(issue.vehicleModel)}</dd>
                    </div>

                    <div className="col-span-2">
                      <dt className="text-gray-500">{t('issue_description', 'Issue')}</dt>
                      <dd className="font-medium text-red-500">{safe(issue.issueDescription)}</dd>
                    </div>

                    <div className="col-span-2">
                      <dt className="text-gray-500">{t('address', 'Address')}</dt>
                      <dd className="font-medium">{safe(issue.location?.issueAddress)}</dd>
                    </div>

                    <div>
                      <dt className="text-gray-500">{t('assigned_to', 'Assigned To')}</dt>
                      <dd className="font-medium">{safe(issue.assignedToName)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('reported', 'Reported')}</dt>
                      <dd className="font-medium">{fmt(issue.createdAt)}</dd>
                    </div>

                    <div className="col-span-2">
                      <dt className="text-gray-500">{t('proposed_solution', 'Proposed')}</dt>
                      <dd className="font-medium">{safe(issue.proposedSolution)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('proposed_cost', 'Proposed Cost')}</dt>
                      <dd className="font-medium">{fmtMoney(issue.proposedCost)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
                    <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                      {t('view', 'View')}
                    </Button>
                    {canApproveReject && (
                      <Button size="sm" onClick={() => setApprovingProposal(issue)}>
                        {t('review', 'Review')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

      <ViewProposalDialog open={!!viewingProposal} issue={viewingProposal} onClose={() => setViewingProposal(null)} />

      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposal(null)}
        onApprove={async () => {
          if (!approvingProposal) return;
          await handleApprove(approvingProposal);
          setApprovingProposal(null);
        }}
        onReject={async (reason: string) => {
          if (!approvingProposal) return;
          await handleReject(approvingProposal, reason);
          setApprovingProposal(null);
        }}
      />
    </div>
  );
}
