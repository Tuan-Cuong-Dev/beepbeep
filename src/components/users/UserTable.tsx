'use client';

import { User } from '@/src/lib/users/userTypes';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (uid: string) => void;
}

export default function UserTable({ users, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-4">
      {/* Mobile View - Card style */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.uid}
            className="border rounded-xl shadow-sm p-4 bg-white"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full overflow-hidden border">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="User"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center text-xs text-gray-500">
                    N/A
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-400">{user.role}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              {user.phone && <p>📞 {user.phone}</p>}
              {user.city && <p>📍 {user.city}, {user.country}</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(user.uid)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border p-4 rounded bg-white shadow overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Email</th>
              <th className="border px-3 py-2">Phone</th>
              <th className="border px-3 py-2">Role</th>
              <th className="border px-3 py-2">Photo</th>
              <th className="border px-3 py-2">City</th>
              <th className="border px-3 py-2">Country</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{user.name}</td>
                <td className="border px-3 py-2">{user.email}</td>
                <td className="border px-3 py-2">{user.phone}</td>
                <td className="border px-3 py-2">{user.role}</td>
                <td className="border px-3 py-2">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="border px-3 py-2">{user.city}</td>
                <td className="border px-3 py-2">{user.country}</td>
                <td className="border px-3 py-2">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onEdit(user)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(user.uid)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
