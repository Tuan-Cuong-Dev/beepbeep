"use client";

import { User } from "@/src/lib/users/userTypes";
import { Button } from "@/src/components/ui/button"; // nếu chưa có import

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (uid: string) => void;
}

export default function UserTable({ users, onEdit, onDelete }: Props) {
  return (
    <div className="border p-6 rounded shadow bg-white overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Full Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Photo</th>
            <th className="border px-4 py-2">Address</th>
            <th className="border px-4 py-2">Address 2</th>
            <th className="border px-4 py-2">City</th>
            <th className="border px-4 py-2">State</th>
            <th className="border px-4 py-2">ZIP</th>
            <th className="border px-4 py-2">Country</th>
            <th className="border px-4 py-2">Home Airport</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid} className="hover:bg-gray-100">
              <td className="border px-4 py-2 whitespace-nowrap">{user.name}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.email}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.phone}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.role}</td>
              <td className="border px-4 py-2 whitespace-nowrap">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-gray-400 italic">N/A</span>
                )}
              </td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.address}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.address2}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.city}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.state}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.zip}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.country}</td>
              <td className="border px-4 py-2 whitespace-nowrap">{user.homeAirport}</td>
                <td className="px-3 py-2 border flex gap-1">
                  <Button size="sm" variant="default" onClick={() => onEdit(user)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(user.uid)}>
                    Delete
                  </Button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
