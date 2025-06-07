// lib/agents/agentTypes.ts

import { Timestamp } from 'firebase/firestore';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  displayAddress: string;
  mapAddress: string;
  location: string; // ví dụ: "16.0728986° N, 108.1620957° E" (chuỗi kinh độ, vĩ độ)
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AgentFormData = Omit<Agent, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
