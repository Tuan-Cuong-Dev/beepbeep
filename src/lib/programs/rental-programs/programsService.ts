import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  Program,
  ProgramParticipant,
  ProgramType,
  ProgramParticipantStatus,
} from '@/src/lib/programs/rental-programs/programsType';

/**
 * Normalize Program data từ Firestore (chống lỗi toMillis)
 */
function normalizeProgram(raw: any, id: string): Program {
  return {
    id,
    title: raw.title,
    description: raw.description,
    type: raw.type,
    createdByUserId: raw.createdByUserId,
    createdByRole: raw.createdByRole,
    companyId: raw.companyId ?? null,
    stationTargets: raw.stationTargets ?? [],
    modelDiscounts: raw.modelDiscounts ?? [],
    startDate: raw.startDate instanceof Timestamp ? raw.startDate : null,
    endDate: raw.endDate instanceof Timestamp ? raw.endDate : null,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt ?? Timestamp.now(),
    updatedAt: raw.updatedAt ?? Timestamp.now(),
  };
}

/**
 * Lấy danh sách Program theo Role
 */
export async function getProgramsByRole(
  role: string,
  companyId?: string | null
): Promise<Program[]> {
  let q;

  if (role === 'agent') {
    q = query(collection(db, 'programs'), where('type', '==', 'agent_program'));
  } else if (role === 'company_owner' || role === 'private_provider') {
    q = query(
      collection(db, 'programs'),
      where('type', '==', 'rental_program'),
      where('companyId', '==', companyId)
    );
  } else if (role === 'admin' || role === 'Admin') {
    q = collection(db, 'programs');
  } else {
    return [];
  }

  const snap = await getDocs(q);
  return snap.docs.map((doc) => normalizeProgram(doc.data(), doc.id));
}

/**
 * Tạo Program mới
 */
export async function createProgram(program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) {
  await addDoc(collection(db, 'programs'), {
    ...program,
    isActive: true, // mặc định chương trình tạo ra sẽ active
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cập nhật Program
 */
export async function updateProgram(programId: string, updates: Partial<Program>) {
  await updateDoc(doc(db, 'programs', programId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Xóa Program
 */
export async function deleteProgram(programId: string) {
  await deleteDoc(doc(db, 'programs', programId));
}

/**
 * Lấy danh sách participants của Program
 */
export async function getProgramParticipants(programId: string): Promise<ProgramParticipant[]> {
  const snap = await getDocs(
    query(collection(db, 'programParticipants'), where('programId', '==', programId))
  );

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProgramParticipant));
}

/**
 * Agent / Customer / Staff tham gia Program
 */
export async function joinProgram(
  programId: string,
  userId: string,
  userRole: 'agent' | 'customer' | 'staff',
  status: ProgramParticipantStatus = 'joined'
) {
  await addDoc(collection(db, 'programParticipants'), {
    programId,
    userId,
    userRole,
    status,
    joinedAt: serverTimestamp(),
  });
}
