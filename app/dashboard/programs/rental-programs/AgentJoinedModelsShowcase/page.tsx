'use client'

import * as React from 'react'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useUser } from '@/src/context/AuthContext'
import AgentJoinedModelsShowcase from '@/src/components/programs/rental-programs/AgentJoinedModelsShowcase'
import { useTranslation } from 'react-i18next'

export default function AgentJoinedModelsShowcasePage() {
  // Tránh warning i18n chưa sẵn sàng
  const { t, ready } = useTranslation('common', { useSuspense: false })
  const { user, loading } = useUser()

  // Layout chuẩn: header + main.flex-1 + footer cố định đáy
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-gray-800">
        <Header />
        <main className="flex-1 p-6 space-y-4">
          <h1 className="text-xl font-bold">
            {t('agent_joined_models_page.title', 'Mẫu xe đã tham gia chương trình')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('common.loading', 'Đang tải dữ liệu…')}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-gray-800">
        <Header />
        <main className="flex-1 p-6 space-y-4">
          <h1 className="text-xl font-bold">
            {t('agent_joined_models_page.title', 'Mẫu xe đã tham gia chương trình')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_page.loading', 'Đang tải thông tin…')}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-gray-800">
        <Header />
        <main className="flex-1 p-6 space-y-4">
          <h1 className="text-xl font-bold">
            {t('agent_joined_models_page.title', 'Mẫu xe đã tham gia chương trình')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_page.login_required', 'Vui lòng đăng nhập để xem danh sách.')}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-800">
      <Header />
      <main className="flex-1 p-6 space-y-4">
        {/* Showcase dạng thẻ cuộn ngang */}
        <AgentJoinedModelsShowcase
          agentId={user.uid}
          limit={12}                        // số card hiển thị
          showViewAllCard                   // hiển thị thẻ “Xem tất cả”
          onViewAllClickHref="/vehicle-models"
        />
      </main>
      <Footer />
    </div>
  )
}
