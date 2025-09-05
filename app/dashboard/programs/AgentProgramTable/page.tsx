'use client'

import React from 'react'
import AgentProgramTable from '@/src/components/programs/rental-programs/AgentProgramTable'
import AgentProgramFilters, { ProgramFilters } from '@/src/components/programs/rental-programs/AgentProgramFilters'
import { useUser } from '@/src/context/AuthContext'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useTranslation } from 'react-i18next'

export default function AgentProgramTablePage() {
  const { user, loading } = useUser()
  const { t } = useTranslation('common')

  // Bộ lọc mặc định
  const [filters, setFilters] = React.useState<ProgramFilters>({
    query: '',
    maxDistanceKm: null,
    includeUnknownDistance: true,
  })

  if (loading) {
    return (
      <main className="p-6 space-y-4">
        <Header />
        <h1 className="text-xl font-bold">
          {t('agent_program_table_page.title', 'Chương trình khuyến mại')}
        </h1>
        <div className="rounded-lg border p-4 text-sm text-gray-600">
          {t('agent_program_table_page.loading', 'Đang tải thông tin…')}
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="p-6 space-y-4">
        <Header />
        <h1 className="text-xl font-bold">
          {t('agent_program_table_page.title', 'Chương trình khuyến mại')}
        </h1>
        <div className="rounded-lg border p-4 text-sm text-gray-600">
          {t('agent_program_table_page.login_required', 'Vui lòng đăng nhập để xem các chương trình phù hợp với bạn.')}
        </div>
        <Footer />
      </main>
    )
  }

  // Fallback toạ độ (khi CTV chặn geolocation) — ví dụ trung tâm Đà Nẵng
  const agentCoordsFallback = { lat: 16.0544, lng: 108.2022 }

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-800">
      <Header />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {t('agent_program_table_page.title', 'Chương trình khuyến mại')}
          </h1>
        </div>

        {/* Bộ lọc tìm kiếm + khoảng cách */}
        <AgentProgramFilters value={filters} onChange={setFilters} />

        {/* Bảng/Thẻ kết quả */}
        <AgentProgramTable
          agentId={user.uid}
          filters={filters}
          includeOnlyOwnedCompanies={true}
          stationCollectionName="rentalStations"
          agentCoordsFallback={agentCoordsFallback}
        />
      </main>
      <Footer />
    </div>
  )
}
