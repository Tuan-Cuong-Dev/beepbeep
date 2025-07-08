// components/profile/AssignedIssuesTable.tsx
import React from 'react';

export const AssignedIssuesTable = ({ issues }: { issues: any[] }) => {
  return (
    <div className="p-4 border-t">
      <h2 className="text-lg font-medium mb-2">Assigned Issues</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Issue</th>
            <th className="p-2">Status</th>
            <th className="p-2">Location</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">{issue.title}</td>
              <td className="p-2">{issue.status}</td>
              <td className="p-2">{issue.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
