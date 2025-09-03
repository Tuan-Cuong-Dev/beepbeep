// lib/my-business/routeConfig.ts
// Định hướng file chung cho Business

import type { BusinessType } from './businessTypes';

export type BusinessRouteConfigItem = {
  collection: string;
  redirect: string;
  role: string;
  additionalData?: Record<string, any>; // ✅ thêm optional
};

export const BUSINESS_ROUTE_CONFIG: Record<BusinessType, BusinessRouteConfigItem> = {
  rental_company:     { collection: 'rentalCompanies',       redirect: '/dashboard/company',             role: 'company_owner' },
  private_provider:   { collection: 'privateProviders',      redirect: '/dashboard/private-provider',    role: 'private_provider' },
  agent:              { collection: 'agents',                redirect: '/dashboard/agent',               role: 'agent' },
  technician_partner: { collection: 'technicianPartners',    redirect: '/dashboard/technician-partner',  role: 'technician_partner' },

  city_driver:        { collection: 'cityDrivers',           redirect: '/dashboard/city-driver',         role: 'city_driver' },
  intercity_driver:   { collection: 'intercityDrivers',      redirect: '/dashboard/intercity-driver',    role: 'intercity_driver' },
  delivery_partner:   { collection: 'deliveryPartners',      redirect: '/dashboard/delivery-partner',    role: 'delivery_partner' },

  intercity_bus:      { collection: 'intercityBusCompanies', redirect: '/dashboard/intercity-bus',       role: 'intercity_bus' },
  vehicle_transport:  { collection: 'vehicleTransporters',   redirect: '/dashboard/vehicle-transport',   role: 'vehicle_transport' },
  tour_guide:         { collection: 'tourGuides',            redirect: '/dashboard/tour-guide',          role: 'tour_guide' },
};
