'use client'

import * as React from 'react'
import Header from '@/src/components/landingpage/Header'
import Footer from '@/src/components/landingpage/Footer'
import { useUser } from '@/src/context/AuthContext'
import AgentJoinedModelsShowcaseLite from '@/src/components/showcase/AgentShowcase';
import { useTranslation } from 'react-i18next'

interface ShowcaseProps {
  agentId: string
  vehicleModelCollectionName?: string
  vehiclesCollectionName?: string
  limitPerRow?: number
  onlyAvailable?: boolean
}

export default function AgentJoinedModelsShowcaseLitePage() {
  const { t, ready } = useTranslation('common', { useSuspense: false })
  const { user, loading } = useUser()

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-gray-800">
        <Header />
        <main className="flex-1 p-6 space-y-4">
          <h1 className="text-xl font-bold">
            {t('agent_joined_models_showcase_page.title')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('loading')}
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
            {t('agent_joined_models_showcase_page.title')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_showcase_page.loading')}
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
            {t('agent_joined_models_showcase_page.title')}
          </h1>
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            {t('agent_joined_models_showcase_page.login_required')}
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
        <AgentJoinedModelsShowcaseLite
          agentId={user.uid}
          limitPerRow={12}
        />
      </main>
      <Footer />
    </div>
  )
}
