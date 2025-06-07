'use client';

import { useUser } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useInvitations } from '@/src/hooks/useInvitationSystem';
import { acceptStaffInvitation } from '@/src/lib/invitations/staff/acceptStaffInvitation';
import { declineStaffInvitation } from '@/src/lib/invitations/staff/declineStaffInvitation';

interface MessageItem {
  id: string;
  userId: string;
  type: 'invitation' | 'notification' | 'system_alert' | 'booking_update';
  content: string;
  status?: string;
  createdAt?: any;
}

export default function MessagesPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const {
    invitations,
    loading: invitationLoading,
    acceptInvitation,
    rejectInvitation,
    refetchInvitations, // ✅ thêm dòng này
  } = useInvitations(user?.uid || null);

  const [loading, setLoading] = useState(true);

  const fetchOtherMessages = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const q = query(
      collection(db, 'messages'),
      where('userId', '==', user.uid),
      where('type', 'in', ['notification', 'system_alert', 'booking_update'])
    );
    const snap = await getDocs(q);
    const systemMessages = snap.docs.map((doc) => ({
      ...(doc.data() as Omit<MessageItem, 'id'>),
      id: doc.id,
    }));
    setMessages(systemMessages);
    setLoading(false);
  };

  const handleAccept = async (invite: any) => {
    await acceptStaffInvitation(invite);
    refetchInvitations(); // ✅ reload danh sách lời mời
  };

  const handleReject = async (inviteId: string) => {
    await declineStaffInvitation(inviteId);
    refetchInvitations(); // ✅ reload danh sách lời mời
  };

  useEffect(() => {
    fetchOtherMessages();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">📩 Messages</h1>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Invitations</h2>
          {invitationLoading ? (
            <div className="flex justify-center py-10 text-gray-500">
              <Loader className="animate-spin w-6 h-6" /> Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-gray-500">You have no invitations at the moment.</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invite) => (
                <div key={invite.id} className="bg-white shadow rounded-xl p-4 border space-y-2">
                  <p className="text-sm text-gray-700">{invite.content}</p>
                  <div className="text-sm text-gray-500">
                    Role: <b>{invite.role}</b>
                  </div>
                  <div className="flex gap-2">
                    {invite.status === 'pending' ? (
                      <>
                        <Button onClick={() => handleAccept(invite)}>Accept</Button>
                        <Button variant="ghost" onClick={() => handleReject(invite.id!)}>Reject</Button>
                      </>
                    ) : (
                      <p className="text-green-600 text-sm">
                        You have {invite.status} this invitation.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">System Notifications</h2>
          {loading ? (
            <div className="flex justify-center py-6 text-gray-500">
              <Loader className="animate-spin w-6 h-6" /> Loading notifications...
            </div>
          ) : messages.length === 0 ? (
            <p className="text-gray-500">No new notifications.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white p-4 rounded-xl border shadow text-sm text-gray-700"
                >
                  <div className="text-xs text-gray-400 mb-1">
                    [{msg.type.replace('_', ' ').toUpperCase()}]
                  </div>
                  {msg.content}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
