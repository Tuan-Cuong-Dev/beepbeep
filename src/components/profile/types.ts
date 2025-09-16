// types.ts
// Dùng cho việc chỉnh hiển thị các tab trong UI Profiles.
// components/profile/types.ts

export interface VisibleTab {
  key:
    | 'activityFeed'
    | 'showcase'
    | 'vehicles'
    | 'insurance'
    | 'issues'
    | 'contributions'
    | 'business';
  label: string;
  visible: boolean;
}

export type TabType = VisibleTab['key'];
