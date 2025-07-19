// app/api/geo/route.ts
export async function GET() {
  try {
    const geoRes = await fetch('https://ipapi.co/json/');
    const geoData = await geoRes.json();
    return Response.json(geoData);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch location info' }), {
      status: 500,
    });
  }
}
