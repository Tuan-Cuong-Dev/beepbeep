import { FormConfiguration } from '@/src/lib/formConfigurations/formConfigurationTypes';
import { DEFAULT_FORM_CONFIG } from '@/src/lib/formConfigurations/defaultFormConfiguration'; 
import { getDoc, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

/**
 * Lấy cấu hình form theo companyId.
 * Nếu không tồn tại thì trả về cấu hình mặc định.
 */
export const getFormConfigurationByCompanyId = async (
  companyId: string
): Promise<FormConfiguration> => {
  const docRef = doc(db, 'formConfigurations', companyId);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<FormConfiguration, 'id'>),
    };
  } else {
    return {
      ...DEFAULT_FORM_CONFIG,
      companyId,
    };
  }
};

/**
 * Lưu cấu hình form (tạo mới hoặc cập nhật).
 * @param config FormConfiguration
 */
export const saveFormConfiguration = async (
  config: FormConfiguration
): Promise<void> => {
  const docRef = doc(db, 'formConfigurations', config.companyId);
  const dataToSave = {
    ...config,
    updatedAt: serverTimestamp(),
  };

  if (config.id) {
    // Cập nhật (update)
    await updateDoc(docRef, dataToSave);
  } else {
    // Tạo mới
    await setDoc(docRef, {
      ...dataToSave,
      createdAt: serverTimestamp(),
    });
  }
};
