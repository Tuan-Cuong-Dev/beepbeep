import { JSX } from 'react';

export interface OrgOption {
  key: string;
  type: string;
  subtype?: string;
  icon: JSX.Element;
  path: string;
}
