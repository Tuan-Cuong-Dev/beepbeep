'use client';

// ✅ Trang quản lý thông tin cộng tác viên (Agent)

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import AgentForm from '@/src/components/rental-management/agent/AgentForm';
import { AgentFormData } from '@/src/lib/agents/agentTypes';
import { getMyAgent, updateAgent } from '@/src/components/rental-management/agent/agentService';

export default function AgentPage() {
  const { user } = useUser();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!user) return;
      const data = await getMyAgent(user.uid);
      if (!data) {
        toast.error('No agent profile found');
        router.push('/my-business/create');
        return;
      }
      setAgent(data);
      setLoading(false);
    };

    fetchAgent();
  }, [user, router]);

  const handleSave = async (formData: AgentFormData) => {
    if (!user || !agent) return;

    setSaving(true);
    try {
      await updateAgent(agent.id, formData);
      toast.success('✅ Agent profile updated successfully');
      // Update local state
      setAgent((prev: any) => ({ ...prev, ...formData }));
    } catch (err) {
      toast.error('❌ Failed to update agent');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-lg">Loading agent profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-10 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white p-8 rounded-3xl shadow-xl border border-gray-200 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Agent Profile</p>
            <h1 className="text-3xl font-bold text-gray-800">👤 Manage Your Agent Information</h1>
            <p className="text-gray-500">Update your personal and contact information below.</p>
          </div>

          <AgentForm
            editingAgent={agent}
            onSave={handleSave}
            onCancel={() => router.push('/my-business')}
          />

          {saving && (
            <p className="text-center text-sm text-gray-500">Saving changes...</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
