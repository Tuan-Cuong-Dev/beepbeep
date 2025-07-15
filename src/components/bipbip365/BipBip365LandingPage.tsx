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
        <section className="bg-[#f0fdf4] px-4 py-10 sm:py-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            {/* Text */}
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#00d289]">
                {bipbip365?.name || 'Gói Bíp Bíp 365K'}
              </h1>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {bipbip365?.description || 'Chỉ 1.000đ/ngày, an tâm cả năm.'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 pt-2">
                <Button size="lg">Mua ngay</Button>
                <Button variant="outline" size="lg">Nhận mã giới thiệu</Button>
              </div>
            </div>

            {/* Image */}
            <div className="w-full flex justify-center md:justify-end">
              <div className="w-full max-w-xs sm:max-w-sm border-2 border-gray-200 rounded-xl overflow-hidden shadow">
                <Image
                  src="https://drive.google.com/uc?export=view&id=1knGrrixxRoCwYW8SU3ihhJuCqZm8fKqE"
                  alt="Thẻ bảo hiểm Bíp Bíp 365K"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-12 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
              Quyền lợi gói 365K
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* List features */}
              <ul className="space-y-3 text-gray-700 text-base list-inside">
                {bipbip365?.features?.length ? (
                  bipbip365.features.map((f, i) => <li key={i}>✅ {f}</li>)
                ) : (
                  <>
                    <li>✅ Miễn phí 3 lần cứu hộ/năm</li>
                    <li>✅ Sửa chữa tại chỗ hoặc kéo xe về trạm</li>
                    <li>✅ Giảm giá phụ tùng & dịch vụ kỹ thuật</li>
                    <li>✅ Theo dõi lịch sử bảo hiểm & cứu hộ</li>
                  </>
                )}
              </ul>

              {/* Image */}
              <div className="w-full flex justify-center md:justify-end">
                <div className="w-full max-w-xs sm:max-w-sm border-2 border-gray-200 rounded-xl overflow-hidden shadow">
                  <Image
                    src="https://drive.google.com/uc?export=view&id=1BEtR9tVBpU3rUeiw5GcA4tr1CkUq9NnG"
                    alt="Quyền lợi Bíp Bíp 365K"
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW TO JOIN + AFFILIATE */}
        <section className="bg-[#f9fafb] py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            
            {/* HOW TO JOIN */}
            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6">Cách tham gia gói 365K</h2>
              <ol className="text-left list-decimal list-inside space-y-3 text-gray-700 text-base">
                <li>Chọn xe cá nhân cần bảo hiểm</li>
                <li>Mua gói Bíp Bíp 365K trực tuyến</li>
                <li>Nhận mã bảo hiểm/thẻ điện tử ngay sau thanh toán</li>
                <li>Gọi cứu hộ/Bảo trì bất cứ khi nào cần</li>
              </ol>
            </div>

            {/* AFFILIATE */}
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold mb-3">🎁 Dành cho Đối tác</h2>
              <p className="text-gray-700 mb-5">
                Giới thiệu khách hàng mua gói 365K, bạn nhận ngay <strong>30% hoa hồng/gói</strong>.
              </p>
              <Link href="/partners/register">
                <Button size="lg">Đăng ký làm đối tác</Button>
              </Link>
            </div>
            
          </div>
        </section>


        {/* FAQ */}
        <section className="bg-[#f0fdf4] py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">Câu hỏi thường gặp</h2>
            <div className="space-y-6 text-base text-gray-700">
              <div>
                <p className="font-semibold">Gói bảo hiểm áp dụng cho xe nào?</p>
                <p>Xe máy điện, xe đạp điện, xe xăng cá nhân.</p>
              </div>
              <div>
                <p className="font-semibold">Tôi có thể mua cho người thân không?</p>
                <p>Có, chỉ cần nhập thông tin xe và chủ xe.</p>
              </div>
              <div>
                <p className="font-semibold">Nếu xe tôi hỏng ở xa thì sao?</p>
                <p>Gọi cứu hộ qua app/web – kỹ thuật viên sẽ đến hỗ trợ tận nơi.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
