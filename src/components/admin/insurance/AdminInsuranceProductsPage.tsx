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
      <main className="flex-grow p-6 max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">🛡️ Insurance Product Management</h1>
          <p className="text-sm text-gray-500 mb-6">
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