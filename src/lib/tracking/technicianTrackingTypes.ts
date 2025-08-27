import type { Timestamp, FieldValue } from 'firebase/firestore';

export type TechnicianOnlineStatus = 'online' | 'paused' | 'offline';

/** Document: technician_presence/{techId} */
export interface TechnicianPresence {
  techId: string;
  name?: string | null;
  companyName?: string | null;

  /** ✅ NEW */
  avatarUrl?: string | null;

  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  batteryLevel?: number | null;
  accuracy?: number | null;

  sessionId?: string | null;
  status: TechnicianOnlineStatus;
  updatedAt: Timestamp | FieldValue;
}

/** Document: technician_tracks/{techId}/sessions/{sessionId} */
export interface TechnicianSession {
  sessionId: string;
  techId: string;
  startedAt: Timestamp | FieldValue;
  endedAt?: Timestamp | FieldValue;
  stats?: TechnicianTrackStats;
}

/** Subcollection point: .../sessions/{sessionId}/points/{pointId} */
export interface TechnicianTrackPoint {
  t: Timestamp | FieldValue;
  lat: number;
  lng: number;
  speed?: number | null;   // m/s
  heading?: number | null; // 0–360
  acc?: number | null;     // accuracy (m)
}

/** Thống kê tổng hợp cho 1 ca */
export interface TechnicianTrackStats {
  totalDistance?: number; // m
  totalTime?: number;     // s
  pointsCount?: number;
}

/** Tiện ích cho UI */
export interface TechnicianPolylinePoint {
  lat: number; lng: number; t?: Date;
}
