'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import FormBuilder from '@/src/components/form-builder/FormBuilder';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

type EntityType = 'rentalCompany' | 'privateProvider';

interface OwnerOption {
  id: string;
  name: string;
}

export default function FormBuilderPage() {
  const { t } = useTranslation('common');
  const { user, companyId, role, loading } = useUser();
  const normalizedRole = (role || '').toLowerCase();
  const canEdit = ['admin', 'company_owner', 'private_provider'].includes(normalizedRole);

  // Loại thực thể đang chỉnh sửa cấu hình
  const [entityType, setEntityType] = useState<EntityType>('rentalCompany');

  // Danh sách thực thể (công ty hoặc private provider) để chọn
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // ====== Setup mặc định theo vai trò người dùng ======
  useEffect(() => {
    if (!user) return;

    // Admin: để ở useEffect khác (tuỳ theo entityType)
    if (normalizedRole === 'admin') {
      setEntityType((prev) => prev || 'rentalCompany');
      return;
    }

    // Company owner: dùng rentalCompany theo companyId của context
    if (normalizedRole === 'company_owner' && companyId) {
      (async () => {
        setEntityType('rentalCompany');
        setLoadingOwners(true);
        // lấy tên công ty
        try {
          const snap = await getDoc(doc(db, 'rentalCompanies', companyId));
          const name = snap.exists() ? (snap.data() as any).name || companyId : companyId;
          setOwners([{ id: companyId, name }]);
          setSelectedOwnerId(companyId);
        } finally {
          setLoadingOwners(false);
        }
      })();
      return;
    }

    // Private provider: tìm provider do user sở hữu
    if (normalizedRole === 'private_provider') {
      (async () => {
        setEntityType('privateProvider');
        setLoadingOwners(true);
        try {
          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          const list: OwnerOption[] = snap.docs.map((d) => ({
            id: d.id,
            name: (d.data() as any).name || d.id,
          }));
          setOwners(list);
          setSelectedOwnerId(list[0]?.id ?? null);
        } finally {
          setLoadingOwners(false);
        }
      })();
      return;
    }
  }, [user?.uid, normalizedRole, companyId]);

  // ====== Admin: nạp danh sách theo entityType đang chọn ======
  useEffect(() => {
    if (normalizedRole !== 'admin') return;
    (async () => {
      setLoadingOwners(true);
      try {
        const col = entityType === 'privateProvider' ? 'privateProviders' : 'rentalCompanies';
        const snap = await getDocs(collection(db, col));
        const list: OwnerOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data() as any).name || d.id,
        }));
        setOwners(list);
        setSelectedOwnerId(list[0]?.id ?? null);
      } finally {
        setLoadingOwners(false);
      }
    })();
  }, [normalizedRole, entityType]);

  if (loading || loadingOwners) return <div>{t('form_builder_page.loading')}</div>;
  if (!user) return <div>{t('form_builder_page.please_sign_in')}</div>;
  if (!canEdit) return <div>{t('form_builder_page.no_permission')}</div>;

  return (
    <>
      <Header />
      <UserTopMenu />

      <main className="max-w-5xl mx-auto py-6 px-4 min-h-[70vh] space-y-6">
        <h1 className="text-2xl font-semibold mb-4">{t('form_builder_page.title')}</h1>

        {/* Admin: chọn loại thực thể + chọn thực thể */}
        {normalizedRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('form_builder_page.select_entity_type')}
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="rentalCompany">{t('form_builder_page.entity_company')}</option>
                <option value="privateProvider">{t('form_builder_page.entity_private_provider')}</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {entityType === 'privateProvider'
                  ? t('form_builder_page.select_provider_label')
                  : t('form_builder_page.select_company_label')}
              </label>
              <select
                value={selectedOwnerId || ''}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Company owner / Private provider: hiển thị tên thực thể (không cho đổi) */}
        {normalizedRole !== 'admin' && owners[0] && (
          <div className="mb-2 text-sm text-gray-700">
            <span className="mr-2">
              {entityType === 'privateProvider' ? '🧑‍💼' : '🏢'}
            </span>
            <span className="font-medium">{owners[0].name}</span>
          </div>
        )}

        {selectedOwnerId && (
          // ⬇️ FormBuilder cần nhận ownerId + entityType để đọc/ghi đúng:
          // getFormConfigurationByEntity(ownerId, entityType)
          // saveFormConfigurationByEntity({ targetId: ownerId, targetType: entityType, ... })
          <FormBuilder ownerId={selectedOwnerId} entityType={entityType} userId={user.uid} />
        )}
      </main>

      <Footer />
    </>
  );
}
