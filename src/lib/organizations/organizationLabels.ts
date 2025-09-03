// 📁 lib/organizations/organizationLabels.ts
import { OrganizationType } from './organizationTypes';

export const ORGANIZATION_LABELS: Record<OrganizationType, string> = {
  rental_company: 'Rental Company',
  private_provider: 'Private Provider',
  agent: 'Agent',
  technician_partner: 'Technician Partner',
  city_driver: 'City Driver',
  intercity_driver: 'Intercity Driver',
  delivery_partner: 'Delivery Partner',
  intercity_bus: 'Intercity Bus Operator',
  vehicle_transport: 'Vehicle Transporter',
  tour_guide: 'Tour Guide',
};
