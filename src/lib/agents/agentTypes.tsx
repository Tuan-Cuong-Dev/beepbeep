// lib/agents/agentTypes.ts

import { Timestamp } from 'firebase/firestore';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;

  displayAddress: string;
  mapAddress: string;
  location: string; // ví dụ: "16.0728986° N, 108.1620957° E"

  ownerId: string; // userId của người tạo agent
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AgentFormData = Omit<Agent, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
