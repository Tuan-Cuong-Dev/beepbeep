'use client';

import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function BipBip365LandingPage() {
  const { products, loading } = useInsuranceProducts();

  const bipbip365 = products.find(p => p.isActive && p.name.includes('365'));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-white">
        {/* Hero Section */}
        <section className="bg-[#f0fdf4] py-12 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#00d289] mb-4">
            {bipbip365?.name || 'Bíp Bíp 365K – Gói bảo hiểm xe điện'} 
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            {bipbip365?.description || 'Chỉ 1.000đ/ngày, an tâm cả năm.'}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">Mua ngay</Button>
            <Button variant="outline" size="lg">Nhận mã giới thiệu</Button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">Quyền lợi gói 365K</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            <ul className="list-disc ml-6 space-y-2">
              {bipbip365?.features?.length ? (
                bipbip365.features.map((f, i) => (
                  <li key={i}>✅ {f}</li>
                ))
              ) : (
                <>
                  <li>✅ Miễn phí 3 lần cứu hộ/năm</li>
                  <li>✅ Sửa chữa tại chỗ hoặc kéo xe về trạm</li>
                  <li>✅ Giảm giá phụ tùng & dịch vụ kỹ thuật</li>
                  <li>✅ Theo dõi lịch sử bảo hiểm & cứu hộ</li>
                </>
              )}
            </ul>

            <div className="rounded border p-4 bg-gray-50 text-center">
              <Image
                src={bipbip365?.imageUrl || '/insurance-card-sample.png'}
                alt="Insurance Card"
                width={300}
                height={200}
                className="mx-auto rounded shadow"
              />
              <p className="text-xs text-gray-400 mt-2">*Hình ảnh minh họa</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#f9fafb] py-12 px-6">
          <h2 className="text-xl font-semibold text-center mb-6">Cách tham gia gói 365K</h2>
          <ol className="list-decimal mx-auto max-w-2xl space-y-3 text-gray-700 text-sm ml-6">
            <li>Chọn xe cá nhân cần bảo hiểm</li>
            <li>Mua gói Bíp Bíp 365K trực tuyến</li>
            <li>Nhận mã bảo hiểm/thẻ điện tử ngay sau thanh toán</li>
            <li>Gọi cứu hộ/Bảo trì bất cứ khi nào cần</li>
          </ol>
        </section>

        {/* Affiliate Section */}
        <section className="py-12 px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-semibold mb-4">🎁 Dành cho Đối tác</h2>
          <p className="text-gray-600 mb-4">
            Giới thiệu khách hàng mua gói 365K, bạn nhận ngay hoa hồng 30%/gói.
          </p>
          <Link href="/partners/register">
            <Button size="lg">Đăng ký làm đối tác</Button>
          </Link>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#f0fdf4] py-12 px-6">
          <h2 className="text-xl font-semibold text-center mb-6">Câu hỏi thường gặp</h2>
          <div className="max-w-3xl mx-auto text-sm text-gray-700 space-y-4">
            <p><strong>Gói bảo hiểm áp dụng cho xe nào?</strong> Xe máy điện cá nhân, xe đạp điện, xe xăng.</p>
            <p><strong>Tôi có thể mua cho người thân không?</strong> Có, chỉ cần nhập thông tin xe và người sở hữu.</p>
            <p><strong>Nếu xe tôi hỏng ở xa thì sao?</strong> Gọi cứu hộ qua app/web, kỹ thuật viên sẽ đến tận nơi hỗ trợ.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
