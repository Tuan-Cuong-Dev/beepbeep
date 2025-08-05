'use client';

import { useState, useEffect } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import Pagination from '@/src/components/ui/pagination';

import SubscriptionPackageForm from '@/src/components/subscriptionPackage/SubscriptionPackageForm';
import SubscriptionPackageTable from '@/src/components/subscriptionPackage/SubscriptionPackageTable';
import SubscriptionPackageSearchImportExport from '@/src/components/subscriptionPackage/SubscriptionPackageSearchImportExport';

import { useSubscriptionPackageData } from '@/src/hooks/useSubscriptionPackageData';
import { exportSubscriptionPackagesToExcel } from '@/src/lib/subscriptionPackages/exportSubscriptionPackages';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SubscriptionPackageManagerPage() {
  const { t } = useTranslation('common');
  const { companyId: rawCompanyId, role, loading: userLoading } = useUser();
  const isAdmin = role === 'Admin';
  const companyId = rawCompanyId ?? '';
  const companyIdToUse = isAdmin ? '' : companyId;

  const {
    packages,
    loading,
    error,
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  } = useSubscriptionPackageData(companyIdToUse);

  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, durationFilter, statusFilter]);

  if (userLoading) {
    return <div className="flex justify-center items-center h-screen">{t('subscription_package_manager_page.loading_user')}</div>;
  }

  if (!companyId && !isAdmin) {
    return <div className="flex justify-center items-center h-screen">{t('subscription_package_manager_page.no_company')}</div>;
  }

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDuration = durationFilter ? pkg.durationType === durationFilter : true;
    const matchesStatus = statusFilter ? pkg.status === statusFilter : true;
    return matchesSearch && matchesDuration && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSave = async (data: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPackage) {
      await updatePackage(editingPackage.id!, data);
      showDialog('success', t('subscription_package_manager_page.updated'));
    } else {
      if (isAdmin) {
        if (!data.companyId) {
          showDialog('error', t('subscription_package_manager_page.company_required'));
          return;
        }
        await createPackage({ ...data, companyId: data.companyId });
      } else {
        await createPackage({ ...data, companyId });
      }
      showDialog('success', t('subscription_package_manager_page.created'));
    }
    await fetchPackages();
    setEditingPackage(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deletePackage(deleteConfirmId);
      await fetchPackages();
      showDialog('success', t('subscription_package_manager_page.deleted'));
      setDeleteConfirmId(null);
    }
  };

  const handleImportComplete = async (imported: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    for (const pkg of imported) {
      await createPackage(pkg);
    }
    await fetchPackages();
    showDialog('success', t('subscription_package_manager_page.imported', { count: imported.length }));
  };

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6 border-b pb-2">{t('subscription_package_manager_page.title')}</h1>

        <SubscriptionPackageSearchImportExport
          packages={packages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          durationFilter={durationFilter}
          setDurationFilter={setDurationFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onExport={() => exportSubscriptionPackagesToExcel(filteredPackages)}
          onImportComplete={handleImportComplete}
          onDeleteAll={async () => {
            for (const pkg of packages) {
              await deletePackage(pkg.id!);
            }
            await fetchPackages();
            showDialog('success', t('subscription_package_manager_page.deleted_all'));
          }}
          companyId={companyId}
        />

        {loading ? (
          <div className="text-center text-gray-500 mt-8">{t('subscription_package_manager_page.loading_packages')}</div>
        ) : error ? (
          <div className="text-center text-red-500 mt-8">{error}</div>
        ) : (
          <>
            <SubscriptionPackageTable
              packages={paginatedPackages}
              onEdit={setEditingPackage}
              onDelete={handleDelete}
            />
            {totalPages > 1 && (
              <div className="mt-2 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </>
        )}

        <div className="mb-8 mt-4">
          <SubscriptionPackageForm
            initialData={editingPackage || undefined}
            onSave={handleSave}
            onCancel={() => setEditingPackage(null)}
          />
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

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('subscription_package_manager_page.confirm_title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {t('subscription_package_manager_page.confirm_desc')}
          </p>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
