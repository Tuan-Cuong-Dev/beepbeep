import * as XLSX from 'xlsx';
import { SubscriptionPackage } from './subscriptionPackagesType';

export function exportSubscriptionPackagesToExcel(packages: SubscriptionPackage[]) {
  if (!packages.length) {
    alert('No packages to export.');
    return;
  }

  const data = packages.map((pkg) => ({
    'Company ID': pkg.companyId,
    'Package Name': pkg.name,
    'Duration Type': pkg.durationType,
    'KM Limit': pkg.kmLimit !== null ? pkg.kmLimit : 'Unlimited',
    'Charging Method': pkg.chargingMethod,
    'Base Price (VND)': pkg.basePrice,
    'Overage Rate (VND/km)': pkg.overageRate !== null ? pkg.overageRate : '-',
    'Note': pkg.note ?? '',
    'Created At': pkg.createdAt?.toDate ? formatDate(pkg.createdAt.toDate()) : '',
    'Updated At': pkg.updatedAt?.toDate ? formatDate(pkg.updatedAt.toDate()) : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SubscriptionPackages');

  XLSX.writeFile(workbook, 'subscription_packages.xlsx');
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
