'use client';

import { useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';

export default function ConnectGoogleDrivePage() {
  const [vehicleFolder, setVehicleFolder] = useState('');
  const [profileFolder, setProfileFolder] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSave = () => {
    // TODO: Save to Firestore here
    alert('Links saved!');
  };

  const extractFileId = (url: string): string | null => {
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  };

  const handlePreview = () => {
    const fileId = extractFileId(vehicleFolder); // Hoặc chọn ảnh cụ thể nếu muốn
    if (fileId) {
      setPreviewUrl(`https://drive.google.com/thumbnail?id=${fileId}`);
    } else {
      alert('Không tìm thấy ID ảnh hợp lệ trong đường dẫn.');
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <Header />

      <main className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-semibold">📂 Hướng dẫn kết nối Google Drive</h1>

        <ol className="list-decimal space-y-2 text-sm pl-5">
        <li>
            Truy cập <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Drive</a>
        </li>
        <li>
            Tạo thư mục gốc tên <strong>bipbipdata</strong>
        </li>
        <li>
            Bên trong thư mục <strong>bipbipdata</strong>, tạo tiếp 4 thư mục con:
            <ul className="list-disc pl-6 mt-1">
            <li><strong>vehiclephotos</strong> – ảnh xe cho thuê</li>
            <li><strong>profilephotos</strong> – ảnh đại diện</li>
            <li><strong>issues</strong> – ảnh lỗi / bảo trì</li>
            <li><strong>documents</strong> – CCCD, GPLX, v.v.</li>
            </ul>
        </li>
        <li>
            Click chuột phải vào từng thư mục → <strong>Chia sẻ</strong> → chọn <em>“Bất kỳ ai có liên kết”</em> → <em>“Người xem”</em>
        </li>
        <li>
            Mở ảnh cụ thể → click chuột phải → <strong>“Lấy liên kết”</strong> → Dán vào hệ thống khi được yêu cầu
        </li>
        </ol>


        <div className="space-y-4">
          <div>
            <Label>Link ảnh minh hoạ (ảnh cụ thể trong Drive)</Label>
            <Input
              value={vehicleFolder}
              onChange={(e) => setVehicleFolder(e.target.value)}
              placeholder="https://drive.google.com/file/d/FILE_ID/view"
            />
            <Button className="mt-2" variant="outline" onClick={handlePreview}>Kiểm tra link ảnh</Button>

            {previewUrl && (
              <div className="mt-4">
                <Label>Xem trước:</Label>
                <img src={previewUrl} alt="Ảnh preview" className="mt-2 rounded shadow border" />
              </div>
            )}
          </div>

          <div>
            <Label>Link thư mục ảnh đại diện (profilephotos)</Label>
            <Input
              value={profileFolder}
              onChange={(e) => setProfileFolder(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>
        </div>

        <Button onClick={handleSave}>Lưu thông tin</Button>
      </main>

      <Footer />
    </>
  );
}
