'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Bipbip365Section() {
  const { i18n } = useTranslation();

  // Ẩn nếu không phải tiếng Việt
  if (i18n.language !== 'vi') return null;

  return (
    <Link href="/bipbip365" className="block group">
      <section className="w-full bg-white text-gray-900 py-10 px-4 md:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text content */}
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold text-[#00d289]">Gói Bíp Bíp 365K</h2>
            <p className="text-xl font-medium">Bảo hiểm dành cho xe điện cá nhân</p>
            <p className="text-gray-600">
              Chỉ <span className="font-semibold text-black">365.000đ/năm</span> – Đăng ký nhanh, hỗ trợ tận nơi.
            </p>
            <p className="text-sm text-gray-500">
              An tâm vận hành – Đồng hành suốt 365 ngày
            </p>
            <div className="mt-4">
              <button className="bg-[#00d289] text-white px-6 py-2 rounded-full font-medium hover:bg-[#00b97c] transition">
                Tìm hiểu ngay
              </button>
            </div>
          </div>

          {/* Image card */}
          <div className="relative aspect-[3/2] w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-xl border">
            <Image
              src="https://drive.google.com/uc?export=view&id=1knGrrixxRoCwYW8SU3ihhJuCqZm8fKqE"
              alt="Bip Bip 365K Card"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>
    </Link>
  );
}
