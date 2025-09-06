'use client'

import React from 'react'
import AgentProgramTable from '@/src/components/programs/rental-programs/AgentProgramTable'
import AgentProgramFilters, { ProgramFilters } from '@/src/components/programs/rental-programs/AgentProgramFilters'
import { useUser } from '@/src/context/AuthContext'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useTranslation } from 'react-i18next'

// Điều chỉnh nếu Footer của bạn cao khác
const FOOTER_HEIGHT = 80 // px

export default function AgentProgramTablePage() {
  const { user, loading } = useUser()
  const { t, ready } = useTranslation('common', { useSuspense: false })

  // Bộ lọc mặc định
  const [filters, setFilters] = React.useState<ProgramFilters>({
    query: '',
    maxDistanceKm: null,
    includeUnknownDistance: true,
  })

  // Fallback toạ độ (khi CTV chặn geolocation) — ví dụ trung tâm Đà Nẵng
  const agentCoordsFallback = { lat: 16.0544, lng: 108.2022 }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-gray-800">
      <Header />

      <main
        className={[
          'flex-1',
          'p-4 sm:p-6',
          `pb-[${FOOTER_HEIGHT}px]`, // nếu Footer fixed thì nội dung không bị che
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">
            {t('agent_program_table_page.title', 'Chương trình khuyến mại')}
          </h1>
        </div>

        {/* i18n chưa sẵn sàng */}
        {!ready && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_program_table_page.loading', 'Đang tải thông tin…')}
          </div>
        )}

        {/* Đang tải Auth */}
        {ready && loading && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_program_table_page.loading', 'Đang tải thông tin…')}
          </div>
        )}

        {/* Chưa đăng nhập */}
        {ready && !loading && !user && (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t(
              'agent_program_table_page.login_required',
              'Vui lòng đăng nhập để xem các chương trình phù hợp với bạn.'
            )}
          </div>
        )}

        {/* Nội dung chính */}
        {ready && !loading && user && (
          <>
            <AgentProgramFilters value={filters} onChange={setFilters} />
            <AgentProgramTable
              agentId={user.uid}
              filters={filters}
              includeOnlyOwnedCompanies={true}
              stationCollectionName="rentalStations"
              agentCoordsFallback={agentCoordsFallback}
            />
          </>
        )}
      </main>

      {/* Spacer cho trường hợp Footer fixed trên mobile (không ảnh hưởng nếu Footer không fixed) */}
      <div className={`h-[${FOOTER_HEIGHT}px] md:hidden`} aria-hidden />

      <Footer />
    </div>
  )
}
