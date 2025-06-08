// pages/contact.tsx
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
    <Header />
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="mb-2">We'd love to hear from you!</p>
      <p className="mb-2">📧 Email: buildinglocalbrand@gmail.com</p>
      <p className="mb-2">📞 Phone: +84 0972 155 557</p>
      <p>🏢 Address: 166 Nguyễn Hoàng, Da Nang, Vietnam</p>
    <Footer />
    </div>
  );
}