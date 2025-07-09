'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
//import AccountForm from '@/src/components/accounts/AccountFormData';

export default function AccountPage() {
  return (
    <>
      <Header />
      <UserTopMenu />
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">
          Account Info
        </h2>

        <div className="border p-6 rounded shadow-lg bg-white">

        </div>
      </main>
      <Footer />
    </>
  );
}
