'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import PendingContributionsTable from '@/src/components/contribute/PendingContributionsTable';

export default function PendingContributionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
            📝 Pending Contributions Review
          </h1>

          <PendingContributionsTable />
        </div>
      </main>

      <Footer />
    </div>
  );
}
