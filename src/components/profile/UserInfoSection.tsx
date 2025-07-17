// components/profile/UserInfoSection.tsx
import React from 'react';

export const UserInfoSection = ({ user }: { user: any }) => {
  return (
    <div className="p-4 border-b space-y-2">
      <h2 className="text-lg font-medium">Personal Info</h2>
      <div>Email: {user.email}</div>
      <div>Phone: {user.phone}</div>
      <div>Address: {user.address}</div>
      <div>Date of Birth: {user.dateOfBirth || 'N/A'}</div>
      <div>ID Number: {user.idNumber || 'N/A'}</div>
    </div>
  );
};