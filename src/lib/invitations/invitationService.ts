// lib/invitations/staff/deleteInvitationMessage.ts
import { db } from '@/src/firebaseConfig';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface DeleteInvitationResult {
  ok: boolean;
  invitationId: string;
  message?: string;
}

/**
 * Xoá lời mời staff.
 * @param id Firestore doc id trong collection 'messages'
 * @param hardDelete true = xoá hẳn, false = chỉ update status
 */
export async function deleteInvitationMessage(
  id: string,
  hardDelete: boolean = false
): Promise<DeleteInvitationResult> {
  if (!id) return { ok: false, invitationId: '', message: 'Missing invitation id' };

  if (hardDelete) {
    await deleteDoc(doc(db, 'messages', id));
    return { ok: true, invitationId: id, message: 'Invitation hard-deleted' };
  }

  await updateDoc(doc(db, 'messages', id), {
    status: 'deleted',
    deletedAt: serverTimestamp(),
  });

  // (Tuỳ chọn) bắn notification cho user
  try {
    const { createNotificationJob } = await import('@/src/lib/notifications/client/sendNotification')
      .catch(() => ({ createNotificationJob: null as any }));
    if (typeof createNotificationJob === 'function') {
      await createNotificationJob({
        templateId: 'invitation.deleted',
        topic: 'invitation',
        audience: { type: 'user', uid: '' }, // ⚠️ cần pass uid nếu có
        data: { invitationId: id, actionUrl: '/messages' },
      });
    }
  } catch {
    // bỏ qua nếu notification system chưa sẵn sàng
  }

  return { ok: true, invitationId: id, message: 'Invitation soft-deleted' };
}
