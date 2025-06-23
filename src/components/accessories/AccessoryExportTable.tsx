'use client';

import { useEffect, useState } from 'react';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import { getUserNameById } from '@/src/lib/services/users/userService';
import { format } from 'date-fns';
import { Input } from '@/src/components/ui/input';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Button } from '@/src/components/ui/button';
import { importBackAccessory } from '@/src/lib/accessories/accessoryExportService';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';

interface Props {
  exports: AccessoryExport[];
}

export default function AccessoryExportTable({ exports }: Props) {
  const [exportedByMap, setExportedByMap] = useState<Record<string, string>>({});
  const [searchName, setSearchName] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [selectedItem, setSelectedItem] = useState<AccessoryExport | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueIds = [...new Set(exports.map((e) => e.exportedBy))];
      const map: Record<string, string> = {};

      for (const uid of uniqueIds) {
        const name = await getUserNameById(uid);
        map[uid] = name || uid;
      }

      setExportedByMap(map);
    };

    fetchUserNames();
  }, [exports]);

  const filtered = [...exports]
    .filter(
      (e) =>
        e.accessoryName?.toLowerCase().includes(searchName.toLowerCase()) &&
        e.target?.toLowerCase().includes(searchTarget.toLowerCase())
    )
    .sort((a, b) => b.exportedAt.toDate().getTime() - a.exportedAt.toDate().getTime());

  const handleImportConfirm = async () => {
    if (!selectedItem) return;
    setImportingId(selectedItem.id);
    try {
      await importBackAccessory(selectedItem);
      alert('Imported back successfully. Please refresh to see changes.');
    } catch (error) {
      console.error(error);
      alert('Failed to import back.');
    } finally {
      setImportingId(null);
      setSelectedItem(null);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by accessory name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          placeholder="Search by target..."
          value={searchTarget}
          onChange={(e) => setSearchTarget(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Accessory</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Target</th>
              <th className="p-2 text-left">Import Price</th>
              <th className="p-2 text-left">Retail Price</th>
              <th className="p-2 text-left">Note</th>
              <th className="p-2 text-left">Exported By</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.accessoryName}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">{item.target}</td>
                <td className="p-2">{formatCurrency(item.importPrice || 0)}</td>
                <td className="p-2">{formatCurrency(item.retailPrice || 0)}</td>
                <td className="p-2">{item.note}</td>
                <td className="p-2 whitespace-nowrap">{exportedByMap[item.exportedBy] || item.exportedBy}</td>
                <td className="p-2 whitespace-nowrap">{format(item.exportedAt.toDate(), 'dd/MM/yyyy')}</td>
                <td className="p-2 text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedItem(item)}
                        disabled={importingId === item.id}
                      >
                        {importingId === item.id ? 'Importing...' : 'Import Back'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Import Back</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to return{' '}
                          <strong>{selectedItem?.accessoryName}</strong> (qty: {selectedItem?.quantity}) into stock?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleImportConfirm} disabled={importingId === selectedItem?.id}>
                          {importingId === selectedItem?.id ? 'Importing...' : 'Confirm'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
