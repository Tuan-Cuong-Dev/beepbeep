'use client';

import * as XLSX from 'xlsx';
import { SubscriptionPackage, DurationType, ChargingMethod } from './subscriptionPackagesType';

export async function importSubscriptionPackagesFromExcel(file: File, companyId: string) {
  return new Promise<Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>[]>((resolve, reject) => {
    if (!companyId) {
      return reject(new Error('❌ Missing companyId when importing subscription packages.'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

        if (!jsonData.length) {
          return reject(new Error('❌ No data found in the Excel sheet.'));
        }

        const packages = jsonData.map((row, index) => {
          const name = row['Package Name']?.toString().trim() || '';
          const durationTypeRaw = row['Duration Type']?.toString().toLowerCase();
          const chargingMethodRaw = row['Charging Method']?.toString().toLowerCase();
          const basePriceRaw = row['Base Price (VND)'];
          const kmLimitRaw = row['KM Limit'];
          const overageRateRaw = row['Overage Rate (VND/km)'];

          const durationType: DurationType = durationTypeRaw === 'monthly' ? 'monthly' : 'daily';
          const chargingMethod: ChargingMethod = chargingMethodRaw === 'self' ? 'self' : 'swap';

          if (!name) {
            throw new Error(`❌ Missing "Package Name" at row ${index + 2}`);
          }

          return {
            companyId,
            name,
            durationType,
            chargingMethod,
            kmLimit: kmLimitRaw === 'Unlimited' ? null : parseIntSafe(kmLimitRaw),
            basePrice: parseIntSafe(basePriceRaw) ?? 0,
            overageRate: overageRateRaw === '-' || overageRateRaw === undefined
              ? null
              : parseIntSafe(overageRateRaw),
            note: row['Note']?.toString().trim() || '', // ✅ Thêm đúng dòng này!
          };
        });

        resolve(packages);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => {
      reject(new Error('❌ Failed to read file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseIntSafe(value: any): number | null {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}
