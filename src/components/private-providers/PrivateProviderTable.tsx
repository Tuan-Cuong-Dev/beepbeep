"use client";

import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";

interface Props {
  providers: PrivateProvider[];
  onEdit: (provider: PrivateProvider) => void;
  onDelete: (id: string) => void;
}

export default function PrivateProviderTable({ providers, onEdit, onDelete }: Props) {
  return (
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Tên</th>
          <th className="p-2 text-left">Email</th>
          <th className="p-2 text-left">Điện thoại</th>
          <th className="p-2 text-left">Địa chỉ</th>
          <th className="p-2 text-left">Tọa độ</th>
          <th className="p-2">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {providers.map((p) => (
          <tr key={p.id} className="border-t hover:bg-gray-50">
            <td className="p-2">{p.name}</td>
            <td className="p-2">{p.email}</td>
            <td className="p-2">{p.phone}</td>
            <td className="p-2">{p.displayAddress}</td>
            <td className="p-2">
              {p.location?.geo
                ? `${p.location.geo.latitude.toFixed(4)}, ${p.location.geo.longitude.toFixed(4)}`
                : p.location?.location || "-"}
            </td>
            <td className="p-2 flex gap-2">
              <button
                onClick={() => onEdit(p)}
                className="text-blue-600 hover:underline"
              >
                Sửa
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-red-600 hover:underline"
              >
                Xóa
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
