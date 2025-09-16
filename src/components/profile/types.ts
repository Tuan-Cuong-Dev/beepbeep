// types.ts
// Dùng cho việc chỉnh hiển thị các tab trong UI Profiles

export type TabKey =
  | 'activityFeed'
  | 'showcase'
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

