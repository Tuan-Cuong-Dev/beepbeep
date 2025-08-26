// types.ts

export type TabKey =
  | 'activityFeed'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions'
  | 'business';


export interface VisibleTab {
  key: string;
  label: string;
  visible: boolean;
}

