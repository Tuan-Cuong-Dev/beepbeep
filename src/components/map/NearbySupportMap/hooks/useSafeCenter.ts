import { useMemo } from 'react';
import { DEFAULT_CENTER } from '../utils/constants';

export function useSafeCenter(
  safeIssue: { lat:number; lng:number } | null,
  openIssuePoints: { issue:any; coord:{ lat:number; lng:number } }[],
) {
  return useMemo<[number, number]>(() => {
    if (safeIssue && Number.isFinite(safeIssue.lat) && Number.isFinite(safeIssue.lng)) {
      return [safeIssue.lat, safeIssue.lng];
    }
    if (openIssuePoints?.length) {
      const c = openIssuePoints[0].coord;
      if (Number.isFinite(c.lat) && Number.isFinite(c.lng)) return [c.lat, c.lng];
    }
    return DEFAULT_CENTER;
  }, [safeIssue?.lat, safeIssue?.lng, openIssuePoints?.length]);
}
