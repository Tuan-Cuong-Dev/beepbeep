'use client';

import { useRouter } from 'next/navigation';
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
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';

export default function AdminDashboard() {
  const router = useRouter();

  const groups = [
    {
      groupTitle: 'Business Types & Users',
      items: [
        {
          icon: <FaStore className="w-6 h-6 text-[#00d289]" />,
          title: 'Rental Companies',
          description: 'Manage all rental businesses',
          route: '/rental-companies',
        },
        {
          icon: <FaWrench className="w-6 h-6 text-[#00d289]" />,
          title: 'Technician Partners',
          description: 'Manage external repair partners',
          route: '/assistant/add-technician-partner',
        },
        {
          icon: <FaUser className="w-6 h-6 text-[#00d289]" />,
          title: 'Users Management',
          description: 'Control user accounts and access',
          route: '/users',
        },
        {
          icon: <FaUserCog className="w-6 h-6 text-[#00d289]" />,
          title: 'Staff Management',
          description: 'Manage all staff members in the system',
          route: '/dashboard/staff',
        },
        {
          icon: <FaUserCog className="w-6 h-6 text-[#00d289]" />,
          title: 'Customers Management',
          description: 'View and manage customer data',
          route: '/customers',
        },
      ],
    },
    {
      groupTitle: 'Vehicles & Batteries',
      items: [
        {
          icon: <FaCar className="w-6 h-6 text-[#00d289]" />,
          title: 'Vehicle Models Management',
          description: 'Manage all Vehicle Models in the system',
          route: '/admin/vehicle_models',
        },
        {
          icon: <FaMotorcycle className="w-6 h-6 text-[#00d289]" />,
          title: 'Vehicle Management',
          description: 'Manage all Vehicles in the system',
          route: '/vehicles',
        },
        {
          icon: <FaWrench className="w-6 h-6 text-[#00d289]" />,
          title: 'Vehicle Issues Management',
          description: 'Monitor and manage all vehicle issues',
          route: '/vehicle-issues',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: 'Battery Management',
          description: 'Track battery inventory and status',
          route: '/battery',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: 'Battery Stations',
          description: 'Manage battery swapping station locations',
          route: '/admin/battery-stations',
        },
        {
          icon: <FaBatteryFull className="w-6 h-6 text-[#00d289]" />,
          title: 'Battery Charging Stations',
          description: 'Manage battery charging station locations',
          route: '/admin/battery-charging-stations',
        },
      ],
    },
    {
      groupTitle: 'Services & Accessories',
      items: [
        {
          icon: <FaToolbox className="w-6 h-6 text-[#00d289]" />,
          title: 'Accessories Management',
          description: 'Manage accessories and parts',
          route: '/accessories',
        },
        {
          icon: <FaFileExport className="w-6 h-6 text-[#00d289]" />,
          title: 'Accessory Export',
          description: 'Export accessory inventory to Excel',
          route: '/accessories/exports',
        },
      ],
    },
    {
      groupTitle: 'Bookings & Programs',
      items: [
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: 'Bookings',
          description: 'View and manage all bookings',
          route: '/bookings',
        },
        {
          icon: <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-[#00d289]" />,
          title: 'Subscription Packages',
          description: 'Set up pricing and rental packages',
          route: '/subscriptionPackages',
        },
        {
          icon: <FaPencilAlt className="w-6 h-6 text-[#00d289]" />,
          title: 'Programs',
          description: 'Manage special programs and promotions',
          route: '/dashboard/programs',
        },
        {
          icon: <FaPencilAlt className="w-6 h-6 text-[#00d289]" />,
          title: 'Form Builder',
          description: 'Customize rental forms for providers',
          route: '/dashboard/form-builder',
        },
      ],
    },
    {
      groupTitle: 'Insurance Management',
      items: [
        {
          icon: <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-[#00d289]" />,
          title: 'Insurance Products',
          description: 'Create and manage user insurance products',
          route: '/admin/insurance-products',
        },
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: 'Insurance Approvals',
          description: 'Review and approve customer insurance requests',
          route: '/admin/insurance-approvals',
        },
      ],
    },
    {
      groupTitle: 'Tools & Contributions',
      items: [
        {
          icon: <FaClipboardList className="w-6 h-6 text-[#00d289]" />,
          title: 'Pending Contributions',
          description: 'Review user-submitted data before approval',
          route: '/admin/pending-contributions',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow p-6 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">🛡️ Admin Dashboard</h1>

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
