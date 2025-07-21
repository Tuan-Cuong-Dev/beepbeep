'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/src/hooks/useAuth';
import { SupportedServiceType } from '@/src/lib/rentalCompanies/rentalCompaniesTypes_new';

interface UserService {
  id: string;
  name: string;
  category: SupportedServiceType;
  vehicleTypes: string[];
  location: string;
  status: 'active' | 'pending' | 'inactive';
  description?: string;
}

// Optional: Friendly labels for service types
const SERVICE_LABELS: Record<SupportedServiceType, string> = {
  repair_basic: 'Basic Repair',
  repair_advanced: 'Advanced Repair',
  battery_replacement: 'Battery Replacement',
  charging_issue: 'Charging Issue',
  maintenance_routine: 'Routine Maintenance',
  brake_service: 'Brake Service',

  rental_self_drive: 'Self-drive Rental',
  rental_with_driver: 'Rental with Driver',
  tour_rental: 'Tour by Vehicle',
  short_term_rental: 'Short-term Rental',
  long_term_rental: 'Long-term Rental',

  battery_swap: 'Battery Swap at Station',
  mobile_swap: 'Mobile Battery Swap',
  battery_health_check: 'Battery Health Check',

  towing: 'Towing / Rescue',
  vehicle_delivery: 'Vehicle Delivery',
  intercity_transport: 'Intercity Transport',

  cleaning: 'Vehicle Cleaning',
  customization: 'Customization / Upgrade',
  accessory_sale: 'Accessory Sales',

  license_support: 'License Support',
  insurance_sale: 'Vehicle Insurance',
  registration_assist: 'Vehicle Registration Help',
};

export default function MyServiceList() {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      if (!currentUser) return;

      const q = query(
        collection(db, 'services'),
        where('userId', '==', currentUser.uid)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserService[];

      setServices(data);
      setLoading(false);
    };

    fetchServices();
  }, [currentUser]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your services...</p>;
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        You haven't published any services yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {services.map((service) => (
        <div
          key={service.id}
          className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {service.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {SERVICE_LABELS[service.category]} •{' '}
                {service.vehicleTypes.join(', ')}
              </p>
              <p className="text-sm text-gray-400">{service.location}</p>
              {service.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {service.description}
                </p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                service.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : service.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {service.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
