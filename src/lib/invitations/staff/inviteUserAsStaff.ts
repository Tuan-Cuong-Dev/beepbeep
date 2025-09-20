// lib/invitations/staff/inviteUserAsStaff.ts
import { db } from '@/src/firebaseConfig';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';

export interface StaffInvitationInput {
  email: string;
  companyId: string;
  role: string;
  stationId?: string;
  content: string;
  userId: string;
  name: string;
  phone: string;
}

export const inviteUserAsStaff = async ({
  email,
  companyId,
  role,
  stationId,
  content,
  userId,
  name,
  phone,
}: StaffInvitationInput) => {
  // Tạo doc mới trong messages (Firestore sẽ sinh ID)
  const ref = doc(collection(db, 'messages'));

  const newInvitation = {
    id: ref.id,
    userId,
    email,
    name,
    phone,
    companyId,
    stationId: stationId ?? '',
    role,
    type: 'invitation',
    content,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, newInvitation);

  // (Tùy chọn) bắn NotificationJob để user thấy lời mời trong NotificationCenter
  try {
    const { createNotificationJob } = await import('@/src/lib/notifications/client/sendNotification')
      .catch(() => ({ createNotificationJob: null as any }));
    if (typeof createNotificationJob === 'function') {
      await createNotificationJob({
        templateId: 'invitation.new',
        topic: 'invitation',
        audience: { type: 'user', uid: userId },
        data: { role, companyId, content, actionUrl: '/messages' },
      });
    }
  } catch {
    // bỏ qua nếu notification system chưa sẵn sàng
  }

  return newInvitation;
};
