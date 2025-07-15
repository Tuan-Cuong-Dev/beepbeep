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
        <section className="bg-[#f0fdf4] px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto flex flex-col-reverse sm:flex-row items-center gap-6">
            {/* Text */}
            <div className="text-center sm:text-left space-y-4 flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#00d289]">
                {bipbip365?.name || 'Gói Bíp Bíp 365K'}
              </h1>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {bipbip365?.description || 'Chỉ 1.000đ/ngày, an tâm cả năm.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start mt-4">
                <Button size="lg">Mua ngay</Button>
                <Button variant="outline" size="lg">Nhận mã giới thiệu</Button>
              </div>
            </div>

            {/* Image */}
            <div className="relative w-full sm:w-[300px] aspect-[4/3] rounded-xl overflow-hidden shadow border">
              <Image
                src="https://drive.google.com/uc?export=view&id=1knGrrixxRoCwYW8SU3ihhJuCqZm8fKqE"
                alt="Bip Bip 365K Card"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
              Quyền lợi gói 365K
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: List features */}
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

              {/* Right: Image */}
              <div className="bg-gray-50 p-4 rounded-xl shadow text-center">
                <Image
                  src="https://drive.google.com/uc?export=view&id=1BEtR9tVBpU3rUeiw5GcA4tr1CkUq9NnG"
                  alt="Insurance Card"
                  width={320}
                  height={220}
                  className="mx-auto rounded"
                />
              </div>
            </div>
          </div>
        </section>


        {/* HOW TO JOIN */}
        <section className="bg-[#f9fafb] py-12 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Cách tham gia gói 365K</h2>
            <ol className="text-left list-decimal list-inside space-y-3 text-gray-700 text-base">
              <li>Chọn xe cá nhân cần bảo hiểm</li>
              <li>Mua gói Bíp Bíp 365K trực tuyến</li>
              <li>Nhận mã bảo hiểm/thẻ điện tử ngay sau thanh toán</li>
              <li>Gọi cứu hộ/Bảo trì bất cứ khi nào cần</li>
            </ol>
          </div>
        </section>

        {/* AFFILIATE */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-3">🎁 Dành cho Đối tác</h2>
            <p className="text-gray-700 mb-5">
              Giới thiệu khách hàng mua gói 365K, bạn nhận ngay <strong>30% hoa hồng/gói</strong>.
            </p>
            <Link href="/partners/register">
              <Button size="lg">Đăng ký làm đối tác</Button>
            </Link>
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
