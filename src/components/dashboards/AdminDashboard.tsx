'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Card, CardContent } from '@/src/components/ui/card';
import {
  FaStore,
  FaMotorcycle,
  FaUser,
  FaUserCog,
  FaBatteryFull,
  FaPencilAlt,
  FaWrench,
  FaClipboardList,
  FaToolbox,
  FaFileExport,
  FaCar,
  FaMapMarkedAlt, // 👈 NEW
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const groups = [
    {
      groupTitle: t('admin_dashboard.groups.business'),
      items: [
        {
          icon: <FaStore className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.rental_companies.title'),
          description: t('admin_dashboard.rental_companies.description'),
          route: '/admin/rental-companies',
        },
        {
          icon: <FaStore className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.rental-stations.title'),
          description: t('admin_dashboard.rental-stations.description'),
          route: '/admin/rental-stations',
        },
        {
          icon: <FaStore className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.private-providers.title'),
          description: t('admin_dashboard.private-providers.description'),
          route: '/admin/private-providers',
        },
        {
          icon: <FaStore className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.agents.title'),
          description: t('admin_dashboard.agents.description'),
          route: '/admin/agents',
        },
        {
          icon: <FaWrench className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.technician_partners.title'),
          description: t('admin_dashboard.technician_partners.description'),
          route: '/assistant/add-technician-partner',
        },
        {
          icon: <FaUserCog className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.staff.title'),
          description: t('admin_dashboard.staff.description'),
          route: '/dashboard/staff',
        },
        {
          icon: <FaUserCog className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.customers.title'),
          description: t('admin_dashboard.customers.description'),
          route: '/customers',
        },
        {
          icon: <FaUser className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.users.title'),
          description: t('admin_dashboard.users.description'),
          route: '/users',
        },
      ],
    },
    {
      groupTitle: t('admin_dashboard.groups.vehicles'),
      items: [
        {
          icon: <FaCar className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.vehicle_models.title'),
          description: t('admin_dashboard.vehicle_models.description'),
          route: '/admin/vehicle_models',
        },
        {
          icon: <FaMotorcycle className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.vehicles.title'),
          description: t('admin_dashboard.vehicles.description'),
          route: '/vehicles',
        },
        {
          icon: <FaWrench className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.vehicle_issues.title'),
          description: t('admin_dashboard.vehicle_issues.description'),
          route: '/vehicle-issues',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.batteries.title'),
          description: t('admin_dashboard.batteries.description'),
          route: '/battery',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.battery_stations.title'),
          description: t('admin_dashboard.battery_stations.description'),
          route: '/admin/battery-stations',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.battery_charging_stations.title'),
          description: t('admin_dashboard.battery_charging_stations.description'),
          route: '/admin/battery-charging-stations',
        },
      ],
    },
    {
      groupTitle: t('admin_dashboard.groups.services'),
      items: [
        {
          icon: <FaToolbox className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.accessories.title'),
          description: t('admin_dashboard.accessories.description'),
          route: '/accessories',
        },
        {
          icon: <FaFileExport className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.accessory_export.title'),
          description: t('admin_dashboard.accessory_export.description'),
          route: '/accessories/exports',
        },
      ],
    },
    {
      groupTitle: t('admin_dashboard.groups.bookings'),
      items: [
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.bookings.title'),
          description: t('admin_dashboard.bookings.description'),
          route: '/bookings',
        },
        {
          icon: <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-[#00d289]" />,
          title: t('admin_dashboard.packages.title'),
          description: t('admin_dashboard.packages.description'),
          route: '/subscriptionPackages',
        },
        {
          icon: <FaPencilAlt className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.programs.title'),
          description: t('admin_dashboard.programs.description'),
          route: '/dashboard/programs',
        },
        {
          icon: <FaPencilAlt className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.form_builder.title'),
          description: t('admin_dashboard.form_builder.description'),
          route: '/dashboard/form-builder',
        },
      ],
    },
    {
      groupTitle: t('admin_dashboard.groups.insurance'),
      items: [
        {
          icon: <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-[#00d289]" />,
          title: t('admin_dashboard.insurance_products.title'),
          description: t('admin_dashboard.insurance_products.description'),
          route: '/admin/insurance-products',
        },
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.insurance_approvals.title'),
          description: t('admin_dashboard.insurance_approvals.description'),
          route: '/admin/insurance-approvals',
        },
      ],
    },
    {
      groupTitle: t('admin_dashboard.groups.tools'),
      items: [
        // 👇 NEW: Live Map card linking to /admin/map
        {
          icon: <FaMapMarkedAlt className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.live_map.title'),
          description: t('admin_dashboard.live_map.description'),
          route: '/admin/map',
        },
        // Live Map của Kỹ thuật viên lưu động
        {
          icon: <FaMapMarkedAlt className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.tech_live_map.title'),
          description: t('admin_dashboard.tech_live_map.description'),
          route: '/admin/technician-live-map',
        },
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: t('admin_dashboard.pending_contributions.title'),
          description: t('admin_dashboard.pending_contributions.description'),
          route: '/admin/pending-contributions',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow p-6 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🛡️ {t('admin_dashboard.title')}
        </h1>

        {groups.map((group) => (
          <section key={group.groupTitle}>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">{group.groupTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <div
                  key={item.title}
                  onClick={() => router.push(item.route)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center space-x-4">
                      {item.icon}
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
