import { WorkingHours } from '@/src/lib/technicianPartners/workingHoursTypes';

const daysOfWeek: WorkingHours['day'][] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const defaultWorkingHours: WorkingHours[] = daysOfWeek.map((day) => ({
  day,
  isWorking: false,
  startTime: '',
  endTime: '',
}));
