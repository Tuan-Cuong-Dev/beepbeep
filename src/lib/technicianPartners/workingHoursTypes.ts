export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorking: boolean;
  startTime: string; // '08:00'
  endTime: string;   // '17:30'
}
