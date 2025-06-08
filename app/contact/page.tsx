'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact</h1>
        <div className="space-y-3 leading-relaxed text-lg">
          <p>We'd love to hear from you!</p>
          <p>📧 <strong>Email:</strong> buildinglocalbrand@gmail.com</p>
          <p>📞 <strong>Phone:</strong> +84 0972 155 557</p>
          <p>🏢 <strong>Address:</strong> 166 Nguyễn Hoàng, Thanh Khê, Da Nang, Vietnam</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
