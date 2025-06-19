// 📄 app/suggest-error/page.tsx
'use client';

import TechnicianSuggestErrorCode from '@/src/components/errorCodes/TechnicianSuggestErrorCode';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';

export default function SuggestErrorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 px-4 py-8">
        <TechnicianSuggestErrorCode />
      </main>
      <Footer />
    </div>
  );
}
