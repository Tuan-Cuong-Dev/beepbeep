'use client';

import * as React from 'react';

import AgentShowcase from '@/src/components/showcase/AgentShowcase';
import CompanyOwnerModelsShowcaseLite from '@/src/components/showcase/CompanyOwnerShowcase';
import PrivateProviderShowcase from '@/src/components/showcase/PrivateProviderShowcase';

type Props = {
  role?: string | null;             // userData.role
  profileUserId: string;            // uid của profile đang xem
  companyId?: string | null;        // userData.companyId (với company_owner)
  limitPerRow?: number;
  onlyAvailable?: boolean;
};

/** Chọn đúng Showcase theo vai trò user. */
export default function ShowcaseSwitcher({
  role,
  profileUserId,
  companyId,
  limitPerRow = 12,
  onlyAvailable = true,
}: Props) {
  const r = (role || '').toLowerCase();

  if (r === 'company_owner') {
    // Company Owner cần có companyId để truy vấn
    if (!companyId) {
      return null; // hoặc hiển thị empty-state nhẹ tùy bạn
    }
    return (
      <CompanyOwnerModelsShowcaseLite
        companyId={companyId}
        limitPerRow={limitPerRow}
        onlyAvailable={onlyAvailable}
      />
    );
  }

  if (r === 'private_provider') {
    return (
      <PrivateProviderShowcase
        providerUserId={profileUserId}
        limitPerRow={limitPerRow}
        onlyAvailable={onlyAvailable}
      />
    );
  }

  // Mặc định (agent hoặc vai trò khác) → dùng Agent showcase
  return (
    <AgentShowcase
      agentId={profileUserId}
      limitPerRow={limitPerRow}
      onlyAvailable={onlyAvailable}
    />
  );

      console.log('[ShowcaseSwitcher]', { role, profileUserId, companyId });
}
