// src/lib/ocr/ocrService.ts
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient(); // ✅ Google SDK sẽ tự đọc GOOGLE_APPLICATION_CREDENTIALS

export async function extractTextFromImage(imageBuffer: Buffer) {
  const [result] = await client.textDetection({ image: { content: imageBuffer } });
  const detections = result.textAnnotations;
  return detections?.map((d) => d.description) || [];
}
