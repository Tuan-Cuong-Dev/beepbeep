// lib/organizations/organizationLabels.ts
import { OrganizationType } from './getUserOrganizations';

export const ORGANIZATION_LABELS: Record<OrganizationType, string> = {
  rental_company: 'Rental Company',
  technician_partner: 'Technician Partner',
  agent: 'Agent',
  private_provider: 'Private Provider',
  tour_guide: 'Tour Guide',
  intercity_bus: 'Intercity Bus Operator',
  vehicle_transport: 'Vehicle Transporter',
};
