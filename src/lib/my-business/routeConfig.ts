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
  rental_company:     { collection: 'rentalCompanies',       redirect: '/dashboard',             role: 'company_owner' },
  private_provider:   { collection: 'privateProviders',      redirect: '/dashboard',      role: 'private_provider' },
  agent:              { collection: 'agents',                redirect: '/dashboard',                 role: 'agent' },
  technician_partner: { collection: 'technicianPartners',    redirect: '/dashboard',    role: 'technician_partner' },

  city_driver:        { collection: 'cityDrivers',           redirect: '/dashboard',           role: 'city_driver' },
  intercity_driver:   { collection: 'intercityDrivers',      redirect: '/dashboard',      role: 'intercity_driver' },
  delivery_partner:   { collection: 'deliveryPartners',      redirect: '/dashboard',      role: 'delivery_partner' },

  intercity_bus:      { collection: 'intercityBusCompanies', redirect: '/dashboard',        role: 'intercity_bus' },
  vehicle_transport:  { collection: 'vehicleTransporters',   redirect: '/dashboard',     role: 'vehicle_transport' },
  tour_guide:         { collection: 'tourGuides',            redirect: '/dashboard',           role: 'tour_guide' },
};
