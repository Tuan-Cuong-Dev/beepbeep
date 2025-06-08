// pages/policy.tsx
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function PolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
    <Header />
      <h1 className="text-3xl font-bold mb-4">Privacy & Policy</h1>
      <p className="mb-2">At Workman, we value your privacy and data protection.</p>
      <ul className="list-disc list-inside space-y-2">
        <li>We do not sell or share your personal information.</li>
        <li>All transactions and data are secured via industry-standard encryption.</li>
        <li>
          You may request account deletion at any time by contacting{' '}
          <span className="text-[#00d289]">support@workman.vn</span>.
        </li>
      </ul>
      <p className="mt-4">Please refer to our full privacy policy for more details.</p>
    <Footer />
    </div>
  );
}