// src/lib/visionClient.ts
// Dùng API Cloud Vision API để xữ lý Scan ID / CCCD... 
// Đang sử dụng

import vision from '@google-cloud/vision';

const credentials = process.env.GOOGLE_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
  : undefined;

export const visionClient = new vision.ImageAnnotatorClient({
  credentials,
});
