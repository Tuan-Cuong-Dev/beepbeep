// components/profile/MyIssuesSection.tsx
'use client';

interface Issue {
  title: string;
  status: string;
  location?: string;
  reportedAt?: string;
}

interface MyIssuesSectionProps {
  issues: Issue[];
}

export default function MyIssuesSection({ issues }: MyIssuesSectionProps) {
  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">My Reported Issues</h2>
      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't reported any vehicle issues yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Location</th>
                <th className="p-2 border">Reported At</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2 border-r">{issue.title}</td>
                  <td className="p-2 border-r capitalize">{issue.status}</td>
                  <td className="p-2 border-r">{issue.location || 'N/A'}</td>
                  <td className="p-2">{issue.reportedAt || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}