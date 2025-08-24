// pages/api/revgeo.ts
// API Route: reverse geocode → formatted + addressCore
// Áp dụng để ghép địa chỉ chuẩn cho Users

import type { NextApiRequest, NextApiResponse } from 'next';
import { mapGeocodeToAddressCore } from '@/src/utils/address';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { lat, lng, lang = 'vi' } = req.query as Record<string, string>;
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key || !lat || !lng) return res.status(400).json({ error: 'missing params' });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${lang}&key=${key}`;
    const r = await fetch(url);
    const json = await r.json();

    if (json.status !== 'OK' || !json.results?.length) {
      return res.status(200).json({ formatted: '', addressCore: null });
    }

    const result = json.results[0];
    const formatted: string = result.formatted_address || '';
    const comps = result.address_components || [];
    const addressCore = mapGeocodeToAddressCore(comps, formatted);

    res.status(200).json({ formatted, addressCore });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'server error' });
  }
}
