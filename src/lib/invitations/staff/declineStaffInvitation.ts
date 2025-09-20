// lib/invitations/staff/declineStaffInvitation.ts
// Update 18/09 - Thí nghiệm Notification Platform

import { db } from '@/src/firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/** Kết quả trả về khi decline */
export interface DeclineInvitationResult {
  ok: boolean;
  invitationId: string;
  message?: string;
}

export const declineStaffInvitation = async (
  inviteId: string
): Promise<DeclineInvitationResult> => {
  if (!inviteId) {
    return { ok: false, invitationId: '', message: 'Missing invitationId' };
  }

  // ✅ 1. Cập nhật trạng thái lời mời → declined
  await updateDoc(doc(db, 'messages', inviteId), {
    status: 'declined',
    declinedAt: serverTimestamp(),
  });

  // ✅ 2. (Tuỳ chọn) bắn NotificationJob cho user nếu bạn đã bật notification system
  try {
    const { createNotificationJob } = await import('@/src/lib/notifications/client/sendNotification')
      .catch(() => ({ createNotificationJob: null as any }));
    if (typeof createNotificationJob === 'function') {
      await createNotificationJob({
        templateId: 'invitation.declined',
        topic: 'invitation',
        audience: { type: 'user', uid: '' }, // ⚠️ cần pass uid nếu bạn có
        data: { invitationId: inviteId, actionUrl: '/invitations' },
      });
    }
  } catch {
    // bỏ qua lỗi notification để không phá luồng chính
  }

  return { ok: true, invitationId: inviteId, message: 'Invitation declined' };
};
