//Agent -  Giới thiệu khách hàng và lịch sử hoa hồng

import { Timestamp } from 'firebase/firestore';

export type ReferralStatus = 'new' | 'contacted' | 'converted' | 'rejected';

export interface AgentReferral {
  id: string;
  agentId: string;          // uid của Agent
  companyId?: string;       // nơi dự định book
  stationId?: string;

  fullName: string;
  phone: string;
  note?: string;

  status: ReferralStatus;
  source?: 'agent_form' | 'agent_link';
  bookingId?: string;       // link khi đã convert
  commissionAmount?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
