// AdminInsuranceProductsPage.tsx
'use client';

import { useState } from 'react';
import CreateInsuranceProductForm from './CreateInsuranceProductForm';
import InsuranceProductsTable from './InsuranceProductsTable';
import { InsuranceProduct } from '@/src/lib/insuranceProducts/insuranceProductTypes';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function AdminInsuranceProductsPage() {
  const [productToEdit, setProductToEdit] = useState<InsuranceProduct | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow px-4 pt-28 pb-10 md:px-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">🛡️ Insurance Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage standard insurance offerings for all users.
          </p>
        </div>

        <section>
          <CreateInsuranceProductForm
            key={productToEdit?.id || 'new'}
            initialProduct={productToEdit}
            onSaveComplete={() => setProductToEdit(null)}
          />
        </section>

        <section>
          <InsuranceProductsTable
            onEdit={(product) => setProductToEdit(product)}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}