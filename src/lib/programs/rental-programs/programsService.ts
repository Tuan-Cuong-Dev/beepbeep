  // 09/09/2025
  'use server';

  import { db } from '@/src/firebaseConfig';
  import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    getDoc,            // ✅ dùng getDoc
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    documentId,
    increment,         // ✅ dùng increment
  } from 'firebase/firestore';
  import type {
    Program,
    ProgramParticipant,
    ProgramParticipantStatus,
    ProgramStatus,
  } from '@/src/lib/programs/rental-programs/programsType';

  /* ===================== helpers ===================== */

  const tsNow = () => Timestamp.now();

  const isTs = (v: any): v is Timestamp => v instanceof Timestamp;

  const coerceTs = (v: any | undefined | null) => (isTs(v) ? v : null);

  /** Suy ra status từ thời gian & isActive (giữ tương thích dữ liệu cũ) */
  function inferStatusFromDates(raw: any): ProgramStatus {
    const active = raw?.isActive !== false;
    const start = coerceTs(raw?.startDate)?.toMillis?.() ?? null;
    const end = coerceTs(raw?.endDate)?.toMillis?.() ?? null;
    const now = Date.now();

    if (raw?.status) return raw.status as ProgramStatus;
    if (!active) return 'paused';
    if (start && now < start) return 'scheduled';
    if (end && now > end) return 'ended';
    return 'active';
  }

  /** Chuẩn hoá Program đọc từ Firestore */
  export function normalizeProgram(raw: any, id: string): Program {
    const coerce = (v: any): Timestamp | null => (v instanceof Timestamp ? v : null);

    return {
      id,
      title: raw?.title ?? '',
      description: raw?.description ?? '',
      type: raw?.type ?? 'rental_program',
      createdByUserId: raw?.createdByUserId ?? '',
      createdByRole: raw?.createdByRole ?? 'company_owner',
      companyId: raw?.companyId ?? null,
      stationTargets: Array.isArray(raw?.stationTargets) ? raw.stationTargets : [],
      modelDiscounts: Array.isArray(raw?.modelDiscounts) ? raw.modelDiscounts : raw?.modelDiscounts ?? [],
      startDate: coerce(raw?.startDate),
      endDate: coerce(raw?.endDate),
      status: inferStatusFromDates(raw),
      isActive: raw?.isActive ?? true,
      participantsCount: typeof raw?.participantsCount === 'number' ? raw.participantsCount : 0, // ✅ ép về 0
      ordersCount: typeof raw?.ordersCount === 'number' ? raw.ordersCount : undefined,
      createdAt: coerce(raw?.createdAt) ?? Timestamp.now(),
      updatedAt: coerce(raw?.updatedAt) ?? Timestamp.now(),
      endedAt: coerce(raw?.endedAt),
      archivedAt: coerce(raw?.archivedAt),
      canceledAt: coerce(raw?.canceledAt),
    };
  }

  /* ===================== queries ===================== */

  /** Lấy danh sách Program theo role */
  export async function getProgramsByRole(
    role: string,
    companyId?: string | null
  ): Promise<Program[]> {
    let qRef: any;

    const r = (role || '').toLowerCase();
    if (r === 'agent') {
      qRef = query(collection(db, 'programs'), where('type', '==', 'agent_program'));
    } else if (['company_owner', 'private_provider', 'company_admin', 'station_manager'].includes(r)) {
      if (!companyId) return [];
      qRef = query(
        collection(db, 'programs'),
        where('type', '==', 'rental_program'),
        where('companyId', '==', companyId)
      );
    } else if (r === 'admin') {
      qRef = collection(db, 'programs');
    } else {
      return [];
    }

    const snap = await getDocs(qRef);
    return snap.docs.map(d => normalizeProgram(d.data(), d.id));
  }

  /* ===================== mutations ===================== */

  /** Tạo Program mới (mặc định active nếu đang trong khung thời gian, ngược lại scheduled) */
  export async function createProgram(
    program: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) {
    const status = inferStatusFromDates(program);
    await addDoc(collection(db, 'programs'), {
      ...program,
      status,
      isActive: status === 'active' || status === 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Cập nhật Program (tự refresh status nếu thời gian thay đổi) */
  export async function updateProgram(programId: string, updates: Partial<Program>) {
    const next = { ...updates, updatedAt: serverTimestamp() } as any;

    if ('startDate' in updates || 'endDate' in updates || 'isActive' in updates || 'status' in updates) {
      next.status = updates.status ?? inferStatusFromDates(updates);
    }

    await updateDoc(doc(db, 'programs', programId), next);
  }

  /* ===================== participants ===================== */

  export async function getProgramParticipants(programId: string): Promise<ProgramParticipant[]> {
    const snap = await getDocs(
      query(collection(db, 'programParticipants'), where('programId', '==', programId))
    );
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ProgramParticipant));
  }

  export async function getParticipantsCount(programId: string): Promise<number> {
    const snap = await getDocs(
      query(collection(db, 'programParticipants'), where('programId', '==', programId))
    );
    return snap.size;
  }

  /** Tham gia chương trình (idempotent theo userId + programId) */
  export async function joinProgram(
    programId: string,
    userId: string,
    userRole: 'agent' | 'customer' | 'staff',
    status: ProgramParticipantStatus = 'joined'
  ) {
    const exists = await getDocs(
      query(
        collection(db, 'programParticipants'),
        where('programId', '==', programId),
        where('userId', '==', userId)
      )
    );
    if (!exists.empty) return;

    await addDoc(collection(db, 'programParticipants'), {
      programId,
      userId,
      userRole,
      status,
      joinedAt: serverTimestamp(),
    });

    // ✅ tăng đếm an toàn
    await updateDoc(doc(db, 'programs', programId), {
      participantsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  /* ===================== safe delete / lifecycle ===================== */

  /** Kiểm tra có thể xoá cứng không (không khuyến khích) */
  export async function canDeleteProgram(programId: string): Promise<{ ok: boolean; reason?: string }> {
    // ✅ đọc thẳng 1 doc
    const snap = await getDoc(doc(db, 'programs', programId));
    if (!snap.exists()) return { ok: true }; // không tồn tại coi như xoá được

    const data = snap.data() as any;
    const count = typeof data?.participantsCount === 'number' ? data.participantsCount : undefined;

    if (typeof count === 'number') {
      return count > 0 ? { ok: false, reason: 'Program has participants' } : { ok: true };
    }

    // Fallback: query thật
    const participants = await getParticipantsCount(programId);
    return participants > 0 ? { ok: false, reason: 'Program has participants' } : { ok: true };
  }

  /** Xoá cứng (chỉ khi chưa ai tham gia) */
  export async function deleteProgramHard(programId: string) {
    const check = await canDeleteProgram(programId);
    if (!check.ok) {
      throw new Error(check.reason || 'Cannot delete program that already has participants.');
    }
    await deleteDoc(doc(db, 'programs', programId));
  }

  /** Soft delete: đổi sang archived (khuyên dùng thay vì delete) */
  export async function archiveProgram(programId: string) {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'archived',
      isActive: false,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
  }

  /** Kết thúc ngay (force end) */
  export async function endProgram(programId: string) {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'ended',
      isActive: false,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
  }

  /** Huỷ chương trình (trước khi chạy) */
  export async function cancelProgram(programId: string) {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'canceled',
      isActive: false,
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
  }
