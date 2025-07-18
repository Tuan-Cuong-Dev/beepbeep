'use client';

import { useUser } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useInvitations } from '@/src/hooks/useInvitationSystem';
import { acceptStaffInvitation } from '@/src/lib/invitations/staff/acceptStaffInvitation';
import { declineStaffInvitation } from '@/src/lib/invitations/staff/declineStaffInvitation';
import { useTranslation } from 'react-i18next';

interface MessageItem {
  id: string;
  userId: string;
  type: 'notification' | 'system_alert' | 'booking_update';
  content: string;
  status?: string;
  createdAt?: any;
}

export default function MessagesPage() {
  const { user } = useUser();
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    invitations,
    loading: invitationLoading,
    acceptInvitation,
    rejectInvitation,
    refetchInvitations,
  } = useInvitations(user?.uid || null);

  useEffect(() => {
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

    fetchOtherMessages();
  }, [user]);

  const handleAccept = async (invite: any) => {
    await acceptStaffInvitation(invite);
    refetchInvitations();
  };

  const handleReject = async (inviteId: string) => {
    await declineStaffInvitation(inviteId);
    refetchInvitations();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          {t('messages_page.title')}
        </h1>

        {/* Invitations Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            {t('messages_page.invitations_title')}
          </h2>
          {invitationLoading ? (
            <div className="flex justify-center py-10 text-gray-500">
              <Loader className="animate-spin w-6 h-6" />
              <span className="ml-2">{t('messages_page.loading_invitations')}</span>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-gray-500">{t('messages_page.no_invitations')}</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invite) => (
                <div key={invite.id} className="bg-white shadow rounded-xl p-4 border space-y-2">
                  <p className="text-sm text-gray-700">{invite.content}</p>
                  <div className="text-sm text-gray-500">
                    {t('messages_page.role_label')}: <b>{invite.role}</b>
                  </div>
                  <div className="flex gap-2">
                    {invite.status === 'pending' ? (
                      <>
                        <Button onClick={() => handleAccept(invite)}>{t('messages_page.accept')}</Button>
                        <Button variant="ghost" onClick={() => handleReject(invite.id!)}>
                          {t('messages_page.reject')}
                        </Button>
                      </>
                    ) : (
                      <p className="text-green-600 text-sm">
                        {t(`messages_page.${invite.status}_message`)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* System Notifications Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            {t('messages_page.notifications_title')}
          </h2>
          {loading ? (
            <div className="flex justify-center py-6 text-gray-500">
              <Loader className="animate-spin w-6 h-6" />
              <span className="ml-2">{t('messages_page.loading_notifications')}</span>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-gray-500">{t('messages_page.no_notifications')}</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white p-4 rounded-xl border shadow text-sm text-gray-700"
                >
                  <div className="text-xs text-gray-400 mb-1">
                    [{t(`messages_page.types.${msg.type}`)}]
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
