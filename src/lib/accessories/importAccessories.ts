// 📁 lib/accessories/importAccessories.ts
import { db } from '@/src/firebaseConfig';
import { collection, setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { Accessory } from './accessoryTypes';
import { Timestamp } from 'firebase/firestore';

export const importAccessories = async (file: File): Promise<Accessory[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(sheet);

  const accessories: Accessory[] = json.map((row) => {
    const type = row.type === 'bulk' ? 'bulk' : 'tracked';
    const id = uuidv4();

    const base: any = {
      id,
      companyId: row.companyId || '',
      name: row.name || '',
      type,
      status: row.status || 'in_stock',
      importDate: row.importDate
        ? Timestamp.fromDate(new Date(row.importDate))
        : Timestamp.fromDate(new Date()),
      notes: row.notes || '',
    };

    if (type === 'tracked') {
      base.code = row.code || '';
    }

    if (type === 'bulk') {
      base.quantity = parseInt(row.quantity || '0');
    }

    return base as Accessory;
  });

  const batchWrite = accessories.map(async (accessory) => {
    const ref = doc(db, 'accessories', accessory.id);
    await setDoc(ref, accessory);
  });

  await Promise.all(batchWrite);
  console.log('✅ Import accessories completed successfully.');

  return accessories;
};
