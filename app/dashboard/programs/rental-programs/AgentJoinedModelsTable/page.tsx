'use client'

import React from 'react'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useUser } from '@/src/context/AuthContext'
import AgentJoinedModelsTable from '@/src/components/programs/rental-programs/AgentJoinedModelsTable'
import { useTranslation } from 'react-i18next'

/**
 * Điều chỉnh nếu Footer của bạn cao khác (px).
 * Nếu Footer KHÔNG fixed, padding này cũng vô hại.
 */
const FOOTER_HEIGHT = 80 // px ~ 5rem

export default function AgentJoinedModelsPage() {
  // Tránh log “i18next was not initialized”
  const { t, ready } = useTranslation('common', { useSuspense: false })
  const { user, loading } = useUser()

  // Khung trang chuẩn: luôn có Header/Footer để không nhảy layout khi chuyển trạng thái
  return (
    <div className="flex min-h-dvh flex-col bg-white text-gray-800">
      <Header />

      <main
        className={[
          'flex-1',
          'p-4 sm:p-6',
          // Nếu Footer fixed, phần đệm này giúp nội dung không bị che
          `pb-[${FOOTER_HEIGHT}px]`,
        ].join(' ')}
      >
        <h1 className="text-xl font-bold mb-4">
          {t('agent_joined_models_page.title', 'Mẫu xe đã tham gia chương trình')}
        </h1>

        {/* i18n chưa sẵn sàng */}
        {!ready && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_page.loading', 'Đang tải thông tin…')}
          </div>
        )}

        {/* Auth đang tải */}
        {ready && loading && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_page.loading', 'Đang tải thông tin…')}
          </div>
        )}

        {/* Chưa đăng nhập */}
        {ready && !loading && !user && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_page.login_required', 'Vui lòng đăng nhập để xem danh sách.')}
          </div>
        )}

        {/* Nội dung chính */}
        {ready && !loading && user && (
          <AgentJoinedModelsTable agentId={user.uid} />
        )}
      </main>

      {/* Spacer cho trường hợp Footer fixed (không ảnh hưởng khi Footer không fixed) */}
      <div className={`h-[${FOOTER_HEIGHT}px] md:hidden`} aria-hidden />

      <Footer />
    </div>
  )
}
