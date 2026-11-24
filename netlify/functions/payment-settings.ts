const PAYMENT_STORE_ID = 'ff808181a09d98f701a20984b0342a22';

const DEFAULT_SETTINGS = {
  id: '00000000-0000-0000-0000-000000000001',
  upi_id: 'psivaram17-1@oksbi',
  account_display_name: 'Sivaram P Babu (NAADANSMASH)',
  qr_image_path: '/images/qr.jpeg',
  payment_instructions: 'Transfer ₹250 via GPay, PhonePe, or Paytm to psivaram17-1@oksbi. Enter the 12-digit UTR reference number upon registration to expedite court check-in.',
};

let memorySettings = { ...DEFAULT_SETTINGS };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function fetchCloudPaymentSettings(): Promise<any> {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${PAYMENT_STORE_ID}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.upi_id) {
        memorySettings = { ...DEFAULT_SETTINGS, ...data.data };
        return memorySettings;
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud payment settings:', e);
  }
  return memorySettings;
}

async function saveCloudPaymentSettings(settings: any): Promise<boolean> {
  memorySettings = { ...memorySettings, ...settings };
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${PAYMENT_STORE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'naadansmash_cloud_payment_v1',
        data: memorySettings,
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not save cloud payment settings:', e);
    return false;
  }
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // GET: Retrieve payment settings
    if (req.method === 'GET') {
      const settings = await fetchCloudPaymentSettings();
      return new Response(
        JSON.stringify({
          success: true,
          settings,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // PUT / POST: Update payment settings
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await req.json();
      const current = await fetchCloudPaymentSettings();
      const updated = {
        ...current,
        ...body,
        updated_at: new Date().toISOString(),
      };

      await saveCloudPaymentSettings(updated);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment settings updated and synced to cloud store.',
          settings: updated,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
