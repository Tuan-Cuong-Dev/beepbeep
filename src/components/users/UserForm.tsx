"use client";

import { useEffect } from "react";
import { User } from "@/src/lib/users/userTypes";

interface Props {
  user: Partial<User>;
  setUser: (user: Partial<User>) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  onSubmit: () => Promise<void>;
}

export default function UserForm({ user, setUser, editingUser, setEditingUser, onSubmit }: Props) {
  useEffect(() => {
    if (editingUser) {
      setUser(editingUser);
    }
  }, [editingUser, setUser]);

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-semibold mb-2">
        {editingUser ? "Update User" : "Add New User"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" value={user.firstName || ""} onChange={(e) => setUser({ ...user, firstName: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Last Name" value={user.lastName || ""} onChange={(e) => setUser({ ...user, lastName: e.target.value })} className="border p-2 rounded w-full" />
        <input type="email" placeholder="Email" value={user.email || ""} onChange={(e) => setUser({ ...user, email: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Phone" value={user.phone || ""} onChange={(e) => setUser({ ...user, phone: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Photo URL" value={user.photoURL || ""} onChange={(e) => setUser({ ...user, photoURL: e.target.value })} className="border p-2 rounded w-full" />
        <select value={user.role || "customer"} onChange={(e) => setUser({ ...user, role: e.target.value })} className="border p-2 rounded w-full">
          <option value="Customer">Customer - End-user who rents a vehicle</option>
          <option value="Staff">Staff - Station employee who assists customers</option>
          <option value="Agent">Agent - Travel & hospitality affiliate partner</option>
          <option value="Station Manager">Station Manager - Manages a specific rental station</option>
          <option value="Company Owner">Company Owner - Business owner who runs rental locations</option>
          <option value="Technician">Technician - Maintenance partner who services vehicles</option>
          <option value="Private Owner">Private Owner - Individual offering personal vehicles for rent</option>
          <option value="Investor">Investor - Contributes capital, monitors financial performance</option>
          <option value="Admin">Admin - Full-access system administrator</option>
        </select>
        <input type="text" placeholder="Address" value={user.address || ""} onChange={(e) => setUser({ ...user, address: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Address 2" value={user.address2 || ""} onChange={(e) => setUser({ ...user, address2: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="City" value={user.city || ""} onChange={(e) => setUser({ ...user, city: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="State/Province/Region" value={user.state || ""} onChange={(e) => setUser({ ...user, state: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="ZIP Code" value={user.zip || ""} onChange={(e) => setUser({ ...user, zip: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Country" value={user.country || ""} onChange={(e) => setUser({ ...user, country: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Home Airport" value={user.homeAirport || ""} onChange={(e) => setUser({ ...user, homeAirport: e.target.value })} className="border p-2 rounded w-full" />
      </div>
      {editingUser ? (
        <div className="mt-4 flex gap-4">
          <button onClick={onSubmit} className="bg-[#00d289] text-white px-4 py-2 rounded">Update User</button>
          <button onClick={() => setEditingUser(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      ) : (
        <button onClick={onSubmit} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Add User</button>
      )}
    </div>
  );
}
