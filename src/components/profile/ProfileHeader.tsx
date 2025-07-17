// components/profile/ProfileHeader.tsx
import React from 'react';

export const ProfileHeader = ({ name, photoURL, role }: { name: string; photoURL: string; role: string }) => {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <img src={photoURL} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
      <div>
        <h1 className="text-xl font-semibold">{name}</h1>
        <p className="text-sm text-gray-500 capitalize">{role.replace('_', ' ')}</p>
      </div>
    </div>
  );
};