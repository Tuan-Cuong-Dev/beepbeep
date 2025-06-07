'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import AccessoryExportForm from '@/src/components/accessories/AccessoryExportForm';

export default function ExportNewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">➕ Export New Accessory</h1>
        <AccessoryExportForm />
      </main>
      <Footer />
    </div>
  );
}
