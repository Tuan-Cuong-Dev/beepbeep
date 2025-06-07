// ✅ Xử lý trích xuất thông tin từ CCCD/CMND bằng Google Vision API

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import { visionClient } from '@/src/lib/visionClient'; // 🔐 client dùng key riêng
import { extractInfoFromRawText } from '@/src/lib/ocr/extractInfo';

export const config = {
  api: {
    bodyParser: false, // ⚠️ để formidable hoạt động
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parsing error:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const rawFile = files.file;
    const uploadedFile: FormidableFile | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // ✅ OCR với Google Vision API
      const [result] = await visionClient.textDetection(uploadedFile.filepath);
      const detections = result.textAnnotations;
      const rawText = detections?.[0]?.description || '';

      if (!rawText.trim()) {
        return res.status(200).json({ error: 'No text detected in the image.' });
      }

      const extracted = extractInfoFromRawText(rawText);

      return res.status(200).json({
        ...extracted,
        rawText,
      });
    } catch (error: any) {
      console.error('❌ OCR error:', error);
      return res.status(500).json({
        error: 'Error during OCR processing',
        message: error?.message || 'Unknown error',
      });
    } finally {
      // ✅ Dọn file tạm
      if (uploadedFile?.filepath && fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
    }
  });
}
