'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Loader } from 'lucide-react';
import { useUser } from '@/src/context/AuthContext';
import { useInvitations } from '@/src/hooks/useInvitationSystem';
import { acceptStaffInvitation } from '@/src/lib/invitations/staff/acceptStaffInvitation';
import { declineStaffInvitation } from '@/src/lib/invitations/staff/declineStaffInvitation';
import NotificationCenter from '@/src/components/notifications/NotificationCenter';
// import OptInPreferencesForm from '@/src/components/notifications/OptInPreferencesForm';
import ZaloLinkCard from '@/src/components/notifications/ZaloLinkCard';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function MessagesPage() {
  const { user } = useUser();
  const { t } = useTranslation('common');

  // Invitations hook
  const {
    invitations,
    loading: invitationLoading,
    refetchInvitations,
  } = useInvitations(user?.uid || null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleAccept = async (invite: any) => {
    if (!invite?.id) return;
    setActionLoadingId(invite.id);
    try {
      await acceptStaffInvitation(invite);
      await refetchInvitations();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    if (!inviteId) return;
    setActionLoadingId(inviteId);
    try {
      await declineStaffInvitation(inviteId);
      await refetchInvitations();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          {t('messages_page.title')}
        </h1>

        {/* Invitations */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            {t('messages_page.invitations_title')}
          </h2>

          {invitationLoading ? (
            <div className="flex justify-center items-center gap-2 py-8 text-gray-500">
              <Loader className="animate-spin w-5 h-5" />
              <span>{t('messages_page.loading_invitations')}</span>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-gray-500">{t('messages_page.no_invitations')}</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invite) => {
                const isActioning = actionLoadingId === invite.id;
                return (
                  <div
                    key={invite.id}
                    className="bg-white shadow rounded-xl p-4 border space-y-2"
                  >
                    <p className="text-sm text-gray-700">{invite.content}</p>
                    <div className="text-sm text-gray-500">
                      {t('messages_page.role_label')}: <b>{invite.role}</b>
                    </div>
                    <div className="flex gap-2">
                      {invite.status === 'pending' ? (
                        <>
                          <Button
                            onClick={() => handleAccept(invite)}
                            disabled={isActioning}
                          >
                            {isActioning ? (
                              <span className="flex items-center gap-2">
                                <Loader className="animate-spin w-4 h-4" />
                                {t('messages_page.processing')}
                              </span>
                            ) : (
                              t('messages_page.accept')
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleReject(invite.id!)}
                            disabled={isActioning}
                          >
                            {t('messages_page.reject')}
                          </Button>
                        </>
                      ) : (
                        <p
                          className={
                            invite.status === 'accepted'
                              ? 'text-green-600 text-sm'
                              : 'text-red-600 text-sm'
                          }
                        >
                          {t(`messages_page.${invite.status}_message`)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Notifications Center */}
        <section className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            {t('messages_page.notifications_title')}
          </h2>
          <NotificationCenter />
        </div>

        <div className="md:col-span-1 space-y-6">
          {/* 👉 Thêm card Zalo ở đây */}
          {user?.uid && <ZaloLinkCard uid={user.uid} />}
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
