export type TabKey =
  | 'activityFeed'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions'
  | 'business';

// types.ts
export interface VisibleTab {
  key: string;
  label: string;
  visible: boolean;
}

