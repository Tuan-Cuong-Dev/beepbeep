// /lib/services/Configirations/formConfigurationService.ts
import { FormConfiguration } from '@/src/lib/formConfigurations/formConfigurationTypes';
import { DEFAULT_FORM_CONFIG } from '@/src/lib/formConfigurations/defaultFormConfiguration';
import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

/** Loại thực thể đang cấu hình form */
export type EntityType = 'rentalCompany' | 'privateProvider';

/** Tạo docId có namespace để tránh đụng id giữa các thực thể khác nhau */
const buildFormConfigDocId = (id: string, entityType: EntityType) =>
  `${entityType}:${id}` as const;

/** DocId legacy (schema cũ): dùng companyId làm documentId */
const legacyDocId = (companyId: string) => companyId;

/**
 * Lấy cấu hình form theo entity (công ty / private provider).
 * Ưu tiên docId mới `${entityType}:${id}`, fallback về legacy nếu là rentalCompany.
 */
export const getFormConfigurationByEntity = async (
  id: string,
  entityType: EntityType
): Promise<FormConfiguration> => {
  // 1) Thử schema mới (namespaced id)
  const v2Ref = doc(db, 'formConfigurations', buildFormConfigDocId(id, entityType));
  const v2Snap = await getDoc(v2Ref);

  if (v2Snap.exists()) {
    const data = v2Snap.data() as Omit<FormConfiguration, 'id'>;
    return {
      id: v2Snap.id,
      ...data,
      // giữ các field tương thích ngược nếu code cũ đang dùng
      targetId: id as any,
      targetType: entityType as any,
      ...(entityType === 'rentalCompany' ? { companyId: id } : {}),
    };
  }

  // 2) Fallback legacy chỉ cho rentalCompany
  if (entityType === 'rentalCompany') {
    const legacyRef = doc(db, 'formConfigurations', legacyDocId(id));
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const data = legacySnap.data() as Omit<FormConfiguration, 'id'>;
      return {
        id: legacySnap.id,
        ...data,
        targetId: id as any,
        targetType: 'rentalCompany' as any,
        companyId: id,
      };
    }
  }

  // 3) Không có thì trả default
  return {
    ...DEFAULT_FORM_CONFIG,
    // id có thể undefined tuỳ interface của bạn
    targetId: id as any,
    targetType: entityType as any,
    ...(entityType === 'rentalCompany' ? { companyId: id } : {}),
  } as FormConfiguration;
};

/**
 * Lưu cấu hình theo entity. Ghi theo docId mới (namespaced).
 * Có thể bật ghi kèm legacy cho rentalCompany để quá độ êm.
 */
export const saveFormConfigurationByEntity = async (
  config: FormConfiguration & { targetId: string; targetType: EntityType },
  opts: { alsoWriteLegacyForCompany?: boolean } = { alsoWriteLegacyForCompany: true }
): Promise<void> => {
  const { targetId, targetType, ...rest } = config;

  const payload = {
    ...rest,
    targetId,
    targetType,
    ...(targetType === 'rentalCompany' ? { companyId: targetId } : {}),
    updatedAt: serverTimestamp(),
  };

  // a) Ghi theo schema mới (merge để hoạt động cho cả tạo mới/cập nhật)
  const v2Ref = doc(db, 'formConfigurations', buildFormConfigDocId(targetId, targetType));
  await setDoc(v2Ref, { ...payload, createdAt: serverTimestamp() }, { merge: true });

  // b) (tuỳ chọn) Ghi legacy cho rentalCompany
  if (opts.alsoWriteLegacyForCompany && targetType === 'rentalCompany') {
    const legacyRef = doc(db, 'formConfigurations', legacyDocId(targetId));
    await setDoc(legacyRef, { ...payload, createdAt: serverTimestamp() }, { merge: true });
  }
};

/* =========================
 *  APIs TƯƠNG THÍCH NGƯỢC
 * ========================= */

/**
 * (Legacy) Lấy cấu hình form theo companyId (rentalCompany).
 * Dưới hood dùng API mới theo entity.
 */
export const getFormConfigurationByCompanyId = async (
  companyId: string
): Promise<FormConfiguration> => {
  return getFormConfigurationByEntity(companyId, 'rentalCompany');
};

/**
 * (Legacy) Lưu cấu hình form theo cấu trúc cũ có companyId.
 * Suy ra targetId/targetType và uỷ quyền cho API mới.
 */
export const saveFormConfiguration = async (
  config: FormConfiguration
): Promise<void> => {
  // Suy ra entity từ config cũ/mới
  const inferredTargetType: EntityType =
    (config as any).targetType ??
    ('companyId' in config && (config as any).companyId ? 'rentalCompany' : 'rentalCompany');

  const inferredTargetId: string =
    (config as any).targetId ??
    ((config as any).companyId || '');

  if (!inferredTargetId) {
    throw new Error('saveFormConfiguration: missing targetId/companyId');
  }

  await saveFormConfigurationByEntity(
    { ...config, targetId: inferredTargetId, targetType: inferredTargetType },
    { alsoWriteLegacyForCompany: true }
  );
};
