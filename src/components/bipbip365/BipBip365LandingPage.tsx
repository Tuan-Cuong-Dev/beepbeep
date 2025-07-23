'use client';

import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function BipBip365LandingPage() {
  const { products } = useInsuranceProducts();
  const bipbip365 = products.find(p => p.isActive && p.name.includes('365'));

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Header />

      <main className="flex-grow">
        {/* HERO */}
        <section className="w-full bg-[#f0fdf4] py-10 px-4 md:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text content */}
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-[#00d289]">
                {bipbip365?.name || 'Gói Bíp Bíp 365K'}
              </h1>
              <p className="text-xl font-medium">
                Gói dịch vụ cứu hộ cho xe điện cá nhân – chỉ 365.000đ/năm
              </p>
              <p className="text-gray-600">
                {bipbip365?.description || 'An tâm vận hành – Đồng hành suốt 365 ngày'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-2">
                <Button size="lg">Mua ngay</Button>
                <Button variant="outline" size="lg">Nhận mã giới thiệu</Button>
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-[3/2] w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-xl border">
              <Image
                src="https://drive.google.com/uc?export=view&id=1knGrrixxRoCwYW8SU3ihhJuCqZm8fKqE"
                alt="Gói dịch vụ cứu hộ Bíp Bíp 365K"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 px-4 md:px-16 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <ul className="space-y-3 text-gray-700 text-base list-inside list-disc">
              <h2 className="text-2xl font-semibold mb-4 text-[#00d289]">Quyền lợi gói 365K</h2>
              {bipbip365?.features?.length ? (
                bipbip365.features.map((f, i) => <li key={i}>✅ {f}</li>)
              ) : (
                <>
                  <li>✅ Miễn phí không giới hạn số lần cứu hộ/năm</li>
                  <li>✅ Sửa chữa tại chỗ hoặc kéo xe về trạm</li>
                  <li>✅ Giảm giá phụ tùng & dịch vụ kỹ thuật</li>
                  <li>✅ Theo dõi lịch sử Dịch vụ cứu hộ & cứu hộ</li>
                </>
              )}
            </ul>

            <div className="relative aspect-[3/2] w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-xl border">
              <Image
                src="https://drive.google.com/uc?export=view&id=1BEtR9tVBpU3rUeiw5GcA4tr1CkUq9NnG"
                alt="Ảnh quyền lợi"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* HOW TO JOIN + AFFILIATE */}
        <section className="bg-[#f9fafb] py-16 px-4 md:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* HOW TO JOIN */}
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-2xl font-semibold text-[#00d289]">Cách tham gia gói 365K</h2>
              <ol className="text-left list-decimal list-inside space-y-3 text-gray-700 text-base">
                <li>Chọn xe cá nhân cần Dịch vụ cứu hộ</li>
                <li>Mua gói Bíp Bíp 365K trực tuyến</li>
                <li>Nhận mã Dịch vụ cứu hộ/thẻ điện tử ngay sau thanh toán</li>
                <li>Gọi cứu hộ/Bảo trì bất cứ khi nào cần</li>
                <li>Mở Bíp Bíp và bấm "HỎNG XE" thì các kỹ thuật gần bạn sẽ đến xữ lý nhanh nhất có thể.</li>
              </ol>
            </div>

            {/* AFFILIATE */}
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-xl font-semibold">🎁 Dành cho Đối tác</h2>
              <p className="text-gray-700">
                Giới thiệu khách hàng mua gói 365K, bạn nhận hoa hồng lên tới <strong>30%/gói</strong>.
              </p>
              <p></p>
              <Link href="/partners/register">
                <Button size="lg">Đăng ký làm đối tác</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#f0fdf4] py-16 px-4 md:px-16">
          <div className="max-w-3xl mx-auto space-y-6 text-base text-gray-700">
            <h2 className="text-2xl font-semibold text-center text-[#00d289] mb-6">
              Câu hỏi thường gặp
            </h2>

            <div className="space-y-6 text-base text-gray-700">
              <div>
                <p className="font-semibold">Gói Dịch vụ cứu hộ áp dụng cho xe nào?</p>
                <p>Xe máy điện, xe đạp điện, xe xăng cá nhân.</p>
              </div>
              <div>
                <p className="font-semibold">Tôi có thể mua cho người thân không?</p>
                <p>Có, chỉ cần nhập thông tin xe và chủ xe.</p>
              </div>
              <div>
                <p className="font-semibold">Nếu xe tôi hỏng ở xa thì sao?</p>
                <p>Mở app/web Bíp Bíp và bấm "HỎNG XE" – kỹ thuật viên sẽ đến hỗ trợ tận nơi.</p>
              </div>
              <div>
                <p className="font-semibold">Dịch vụ đang áp dụng tại tỉnh thành phố nào?</p>
                <p>Chúng tôi hiện chỉ áp dụng tại Thành phố Đà Nẵng.</p>
              </div>
              <div>
                <p className="font-semibold">Không dùng web/app Bíp Bíp thì gọi số nào?</p>
                <p>Bạn có thể gọi tổng đài <strong>1800 8389</strong> để được hỗ trợ nhanh chóng.</p>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
