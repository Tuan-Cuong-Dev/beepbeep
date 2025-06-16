// 📄 components/servicePricing/ServicePricingTable.tsx
'use client';

import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  servicePricings: ServicePricing[];
  onEdit: (item: ServicePricing) => void;
  onDelete: (id: string) => void;
}

export default function ServicePricingTable({ servicePricings, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Features</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {servicePricings.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2 font-medium">{item.title}</td>
              <td className="p-2">{item.price.toLocaleString()} VND</td>
              <td className="p-2">{item.features.join(', ')}</td>
              <td className="p-2 text-right space-x-2">
                <Button variant="outline" onClick={() => onEdit(item)}>Edit</Button>
                <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}