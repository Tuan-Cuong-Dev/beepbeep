// ✅ Service xử lý dữ liệu Agent từ Firestore

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    Timestamp,
  } from 'firebase/firestore';
  import { db } from '@/src/firebaseConfig';
  import { Agent, AgentFormData } from '@/src/lib/agents/agentTypes';
  
  export async function getMyAgent(ownerId: string): Promise<Agent | null> {
    const q = query(collection(db, 'agents'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
  
    const docData = snap.docs[0];
    return {
      id: docData.id,
      ...(docData.data() as Omit<Agent, 'id'>),
    };
  }
  
  export async function updateAgent(id: string, data: AgentFormData): Promise<void> {
    await updateDoc(doc(db, 'agents', id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }
  
  export async function createAgent(ownerId: string, data: AgentFormData): Promise<string> {
    const docRef = await addDoc(collection(db, 'agents'), {
      ...data,
      ownerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }
  