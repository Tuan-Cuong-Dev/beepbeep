'use client';

import { useState } from 'react';
import { useErrorCodes } from '@/src/hooks/useErrorCodes';
import ErrorCodeForm from '@/src/components/errorCodes/ErrorCodeForm';
import ErrorCodeTable from '@/src/components/errorCodes/ErrorCodeTable';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';

export default function ErrorCodeManagementPage() {
  const { errorCodes, loading, deleteErrorCode, refetch } = useErrorCodes();
  const [selected, setSelected] = useState<ErrorCode | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-6 sm:py-10 sm:px-6 md:px-8 max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          📋 Error Code Management
        </h1>

        <section className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">📑 Existing Error Codes</h2>
          {loading ? (
            <p className="text-gray-500">Loading error codes...</p>
          ) : (
            <ErrorCodeTable
              errorCodes={errorCodes}
              onEdit={(item) => setSelected(item)}
              onDelete={(item) => {
                if (confirm(`Are you sure you want to delete error code ${item.code}?`)) {
                  deleteErrorCode(item.id);
                }
              }}
            />
          )}
        </section>

        <section className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">➕ Add / Edit Error Code</h2>
          <ErrorCodeForm
            key={selected?.id || 'new'}
            existing={selected}
            onSaved={async () => {
              setSelected(null);
              await refetch();
            }}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
