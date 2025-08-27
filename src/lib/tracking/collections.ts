// (Tuỳ chọn) Hằng số đường dẫn collection — giúp code đồng nhất

export const COLLECTIONS = {
  presence: 'technician_presence',
  tracksRoot: 'technician_tracks',
  sessions: (techId: string) => `technician_tracks/${techId}/sessions`,
  points: (techId: string, sessionId: string) =>
    `technician_tracks/${techId}/sessions/${sessionId}/points`,
} as const;
