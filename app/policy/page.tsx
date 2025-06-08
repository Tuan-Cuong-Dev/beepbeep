'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function PolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Privacy & Policy</h1>
        <p className="mb-4 text-lg">
          At Bíp Bíp, we value your privacy and data protection. We are committed to being transparent with how we handle your data.
        </p>
        <ul className="list-disc list-inside space-y-3 text-base leading-relaxed">
          <li>We do not sell or share your personal information.</li>
          <li>All transactions and data are secured via industry-standard encryption.</li>
          <li>
            You may request account deletion at any time by contacting{' '}
            <span className="text-[#00d289] font-medium">buildinglocalbrand@gmail.com</span>.
          </li>
        </ul>
        <p className="mt-6 text-base">
          Please refer to our full privacy policy for more details or contact us directly with any concerns.
        </p>
      </main>

      <Footer />
    </div>
  );
}
