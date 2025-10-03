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

      <main className="flex-1">
        {/* Page header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('messages_page.title')}
          </h1>
        </div>

        {/* Content layout: 2 columns on desktop; stacked on mobile */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Invitations + Notifications */}
            <div className="lg:col-span-8 space-y-8">
              {/* Invitations */}
              <section className="rounded-2xl border bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {t('messages_page.invitations_title')}
                  </h2>
                </div>

                <div className="px-4 sm:px-5 py-4">
                  {invitationLoading ? (
                    <div className="flex justify-center items-center gap-2 py-8 text-gray-500">
                      <Loader className="animate-spin w-5 h-5" />
                      <span>{t('messages_page.loading_invitations')}</span>
                    </div>
                  ) : invitations.length === 0 ? (
                    <p className="text-gray-500">{t('messages_page.no_invitations')}</p>
                  ) : (
                    <ul className="space-y-4">
                      {invitations.map((invite) => {
                        const isActioning = actionLoadingId === invite.id;
                        return (
                          <li
                            key={invite.id}
                            className="rounded-xl border bg-white/80 p-4 sm:p-5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-gray-800 break-words">
                                {invite.content}
                              </p>
                              <div className="mt-1 text-xs text-gray-500">
                                {t('messages_page.role_label')}: <b>{invite.role}</b>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                              {invite.status === 'pending' ? (
                                <>
                                  <Button
                                    className="sm:w-auto"
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
                                    className="sm:w-auto"
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
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              {/* Notifications Center */}
              <section className="rounded-2xl border bg-white shadow-sm">
                <div className="px-4 sm:px-5 py-4 border-b">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {t('messages_page.notifications_title')}
                  </h2>
                </div>
                <div className="px-2 sm:px-4 py-4">
                  {/* Wrap to keep inner list aligned with card edges */}
                  <NotificationCenter />
                </div>
              </section>
            </div>

            {/* Right: Sidebar (sticky on large screens) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
              {user?.uid && (
                <ZaloLinkCard uid={user.uid} />
              )}

              {/* You can place more cards here later
              <OptInPreferencesForm /> */}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
