'use client'

import React from 'react'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useUser } from '@/src/context/AuthContext'
import AgentJoinedModelsTable from '@/src/components/programs/rental-programs/AgentJoinedModelsTable'
import { useTranslation } from 'react-i18next'

/** Điều chỉnh nếu Footer của bạn cao khác (px). */
const FOOTER_HEIGHT = 80 // px ~ 5rem

export default function AgentJoinedModelsPage() {
  const { t, ready } = useTranslation('common', { useSuspense: false })
  const { user, loading } = useUser()

  // Fallback toạ độ khi agent chặn geolocation (ví dụ: trung tâm Đà Nẵng)
  // Dùng useMemo để tránh tạo object mới mỗi lần render.
  const agentCoordsFallback = React.useMemo(
    () => ({ lat: 16.0544, lng: 108.2022 }),
    []
  )

  return (
    <div className="flex min-h-dvh flex-col bg-white text-gray-800">
      <Header />

      <main className="flex-1 p-4 sm:p-6" style={{ paddingBottom: FOOTER_HEIGHT }}>
        <h1 className="mb-4 text-xl font-bold">
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
          <AgentJoinedModelsTable
            agentId={user.uid}
            /** 👇 đảm bảo luôn tính được khoảng cách dù trình duyệt chặn geolocation */
            agentCoordsFallback={agentCoordsFallback}

          />
        )}

        {/* Gợi ý quyền vị trí (tùy chọn) */}
        {ready && !loading && user && (
          <p className="mt-3 text-xs text-gray-500">
            {t(
              'agent_joined_models_page.distance_hint',
              'Mẹo: Hãy cho phép quyền vị trí trong trình duyệt để khoảng cách hiển thị chính xác hơn. Nếu bị chặn, hệ thống dùng vị trí mặc định để vẫn ước lượng được khoảng cách.'
            )}
          </p>
        )}
      </main>

      {/* Spacer cho trường hợp Footer fixed (ẩn trên desktop) */}
      <div className="md:hidden" style={{ height: FOOTER_HEIGHT }} aria-hidden />

      <Footer />
    </div>
  )
}
  