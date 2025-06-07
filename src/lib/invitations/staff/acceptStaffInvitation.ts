// lib/invitations/staff/acceptStaffInvitation.ts
import { db } from '@/src/firebaseConfig';
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { updateUser } from '@/src/lib/services/users/userService';

export const acceptStaffInvitation = async (invite: any) => {
  if (!invite.id || !invite.userId || !invite.companyId || !invite.role) return;

  // ✅ 1. Cập nhật status của lời mời
  await updateDoc(doc(db, 'messages', invite.id), {
    status: 'accepted',
  });

  // ✅ 2. Cập nhật role = 'staff' trong users
  await updateUser(invite.userId, { role: 'staff' });

  // ✅ 3. Lấy thông tin user để đưa vào staff (nếu cần)
  const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', invite.userId)));
  const userInfo = userSnap.docs[0]?.data() || {};

  // ✅ 4. Kiểm tra xem đã tồn tại staff chưa
  const staffSnap = await getDocs(
    query(
      collection(db, 'staffs'),
      where('userId', '==', invite.userId),
      where('companyId', '==', invite.companyId),
      where('role', '==', invite.role)
    )
  );

  if (staffSnap.empty) {
    // ➕ Nếu chưa có thì tạo mới
    await addDoc(collection(db, 'staffs'), {
      userId: invite.userId,
      companyId: invite.companyId,
      stationId: invite.stationId || '',
      role: invite.role,
      name: userInfo.name || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      accepted: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    // 🔄 Nếu đã có thì chỉ cập nhật lại
    const staffDoc = staffSnap.docs[0];
    await updateDoc(doc(db, 'staffs', staffDoc.id), {
      accepted: true,
      name: userInfo.name || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      updatedAt: Timestamp.now(),
    });
  }
};
