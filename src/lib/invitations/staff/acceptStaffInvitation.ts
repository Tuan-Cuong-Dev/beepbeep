// lib/invitations/staff/acceptStaffInvitation.ts
// Update 18/09 - Thí nghiệm Notification Flatform

import { db } from '@/src/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { updateUser } from '@/src/lib/services/users/userService';

/** Kiểu lời mời (có thể mở rộng về sau) */
export interface StaffInvitation {
  id: string;
  userId: string;
  companyId: string;
  role: 'company_admin' | 'station_manager' | 'technician' | 'support' | string;
  stationId?: string;
  content?: string;
  email?: string;
  name?: string;
  phone?: string;
  type?: 'invitation';
  status?: 'pending' | 'accepted' | 'declined';
  createdAt?: any;
}

/** Kết quả trả về để hiển thị/log */
export interface AcceptInvitationResult {
  ok: boolean;
  invitationId: string;
  staffDocId?: string;
  message?: string;
}

function buildDeterministicStaffId(companyId: string, userId: string, role: string) {
  // Giảm rủi ro ký tự lạ trong doc id
  const safe = (s: string) => s.replace(/[^\w\-.:@]/g, '_');
  return `staff:${safe(companyId)}:${safe(userId)}:${safe(role)}`;
}

export const acceptStaffInvitation = async (invite: StaffInvitation): Promise<AcceptInvitationResult> => {
  // ✅ Validate tối thiểu
  if (!invite?.id || !invite?.userId || !invite?.companyId || !invite?.role) {
    return { ok: false, invitationId: invite?.id || '', message: 'Missing required fields' };
  }

  const { id: invitationId, userId, companyId, role } = invite;

  // ✅ 1) Cập nhật trạng thái lời mời → accepted
  await updateDoc(doc(db, 'messages', invitationId), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });

  // ✅ 2) Cập nhật role user = 'staff' (giữ API cũ để không phá luồng khác của bạn)
  await updateUser(userId, { role: 'staff' });

  // ✅ 3) Lấy thông tin user (ít round-trip hơn so với query __name__)
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userInfo = (userSnap.exists() ? userSnap.data() : {}) as Partial<{
    name: string; email: string; phone: string;
  }>;

  // ✅ 4) Upsert staff bằng ID quyết định để idempotent (tránh trùng)
  const staffId = buildDeterministicStaffId(companyId, userId, role);
  const staffRef = doc(db, 'staffs', staffId);

  await setDoc(
    staffRef,
    {
      userId,
      companyId,
      stationId: invite.stationId ?? '',
      role,
      name: invite.name ?? userInfo.name ?? '',
      email: invite.email ?? userInfo.email ?? '',
      phone: invite.phone ?? userInfo.phone ?? '',
      accepted: true,
      // setDoc + merge:true sẽ không ghi đè createdAt nếu đã tồn tại trước đó
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // ✅ 5) (Tùy chọn) Bắn Notification Job — an toàn, không làm hỏng flow nếu module chưa tồn tại
  try {
    const { createNotificationJob } = await import('@/src/lib/notifications/client/sendNotification')
      .catch(() => ({ createNotificationJob: null as any }));
    if (typeof createNotificationJob === 'function') {
      await createNotificationJob({
        templateId: 'invitation.accepted',
        topic: 'invitation',
        audience: { type: 'user', uid: userId },
        data: {
          role,
          companyId,
          actionUrl: '/invitations', // hoặc /messages
        },
      });
    }
  } catch {
    // bỏ qua lỗi thông báo để không chặn luồng chính
  }

  return {
    ok: true,
    invitationId,
    staffDocId: staffId,
    message: 'Invitation accepted and staff upserted',
  };
};
