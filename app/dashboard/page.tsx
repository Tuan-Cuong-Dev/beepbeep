'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getDocs, query, where, collection } from 'firebase/firestore'
import { db } from '@/src/firebaseConfig'
import { useUser } from '@/src/context/AuthContext'
import { useTranslation } from 'react-i18next'

import RentalCompanyDashboard from '@/src/components/dashboards/RentalCompanyDashboard'
import PrivateProviderDashboard from '@/src/components/dashboards/PrivateProviderDashboard'
import AgentDashboard from '@/src/components/dashboards/AgentDashboard'
import AdminDashboard from '@/src/components/dashboards/AdminDashboard'
import StaffDashboard from '@/src/components/dashboards/StaffDashboard'
import TechnicianDashboard from '@/src/components/dashboards/TechnicianDashboard'
import CompanyAdminDashboard from '@/src/components/dashboards/CompanyAdminDashboard'
import StationManagerDashboard from '@/src/components/dashboards/StationManagerDashboard'
import TechnicianAssistantDashboard from '@/src/components/dashboards/TechnicianAssistantDashboard'
import TechnicianPartnerDashboard from '@/src/components/dashboards/TechnicianPartnerDashboard'

interface StaffEntry {
  id: string
  role: string
  [key: string]: any
}

type BusinessType =
  | 'admin'
  | 'technician_assistant'
  | 'technician_partner'
  | 'rental_company_owner'
  | 'private_provider'
  | 'agent'
  | 'company_admin'
  | 'station_manager'
  | 'staff'
  | 'technician'
  | null

export default function MyBusinessPage() {
  const { user, role, loading } = useUser()
  const router = useRouter()
  const { t } = useTranslation('common')

  const [businessType, setBusinessType] = useState<BusinessType>(null)
  const [staffRoles, setStaffRoles] = useState<StaffEntry[]>([])

  useEffect(() => {
    if (loading || !user) return

    const r = (role || '').toLowerCase()
    console.log('[MyBusinessPage] context role', r)

    // Ưu tiên vai trò toàn cục từ AuthContext
    if (r === 'technician_assistant') return setBusinessType('technician_assistant')
    if (r === 'technician_partner') return setBusinessType('technician_partner')
    if (r === 'admin') return setBusinessType('admin')
    if (r === 'private_provider') return setBusinessType('private_provider')

    const fetchData = async () => {
      try {
        // Quyền sở hữu các entity chính
        const rentalOwnerQ = query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
        const providerOwnerQ = query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
        const agentQ = query(collection(db, 'agents'), where('ownerId', '==', user.uid))

        const [rentalSnap, providerSnap, agentSnap] = await Promise.all([
          getDocs(rentalOwnerQ),
          getDocs(providerOwnerQ),
          getDocs(agentQ),
        ])

        const isRentalOwner = !rentalSnap.empty
        const isProviderOwner = !providerSnap.empty
        const isAgentOwner = !agentSnap.empty

        console.log('[MyBusinessPage] ownership flags', {
          userId: user.uid,
          isRentalOwner,
          isProviderOwner,
          isAgentOwner,
        })

        if (isRentalOwner) {
          setBusinessType('rental_company_owner')
          return
        }
        if (isProviderOwner) {
          setBusinessType('private_provider')
          return
        }
        if (isAgentOwner) {
          setBusinessType('agent')
          return
        }

        // Fallback: staff (nhân sự)
        const staffSnap = await getDocs(query(collection(db, 'staffs'), where('userId', '==', user.uid)))
        if (!staffSnap.empty) {
          const staffData: StaffEntry[] = staffSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
          setStaffRoles(staffData)
          const staffRole = (staffData[0]?.role ?? '').toLowerCase()
          console.log('[MyBusinessPage] staff fallback', { staffRole, staffCount: staffData.length })

          switch (staffRole) {
            case 'technician':
              setBusinessType('technician')
              return
            case 'station_manager':
              setBusinessType('station_manager')
              return
            case 'company_admin':
              setBusinessType('company_admin')
              return
            default:
              setBusinessType('staff')
              return
          }
        }

        console.log('[MyBusinessPage] no ownership & no staff → redirect to create')
        router.replace('/my-business/create')
      } catch (e) {
        console.error('[MyBusinessPage] fetchData error', e)
        router.replace('/my-business/create')
      }
    }

    fetchData()
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        {t('loading')}
      </div>
    )
  }

  return (
    <main className="min-h-screen space-y-6 bg-gray-50">
      {businessType === 'admin' && <AdminDashboard />}
      {businessType === 'technician_assistant' && <TechnicianAssistantDashboard />}
      {businessType === 'technician_partner' && <TechnicianPartnerDashboard />}
      {businessType === 'rental_company_owner' && <RentalCompanyDashboard />}
      {businessType === 'private_provider' && <PrivateProviderDashboard />}
      {businessType === 'agent' && <AgentDashboard />}
      {businessType === 'company_admin' && <CompanyAdminDashboard />}
      {businessType === 'station_manager' && <StationManagerDashboard />}
      {businessType === 'staff' && <StaffDashboard />}
      {businessType === 'technician' && <TechnicianDashboard />}
      {!businessType && (
        <div className="text-center text-gray-500">{t('my_business.no_business')}</div>
      )}
    </main>
  )
}
