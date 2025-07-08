// components/profile/RoleTabs.tsx
import React from 'react';

export const RoleTabs = ({ role }: { role: string }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-medium">Role Specific Info</h2>
      <p>Role: {role}</p>
      {/* You can expand this with switch-case to render specific components */}
    </div>
  );
};
