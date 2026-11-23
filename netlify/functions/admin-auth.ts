import { getStore } from '@netlify/blobs';

const DEFAULT_ADMIN = {
  phone: '8304883872',
  password: 'naadansmash2026',
  fallbackPhones: ['8304883872', '9876543210', '918304883872'],
  fallbackPasswords: ['naadansmash2026', 'admin123'],
};

// In-memory fallback for local dev
let currentAdminConfig = { ...DEFAULT_ADMIN };

function getAdminStore() {
  try {
    return getStore({ name: 'naadansmash_admin', consistency: 'strong' });
  } catch {
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const store = getAdminStore();

  try {
    // -------------------------------------------------------------
    // GET: Get public organiser contact info
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      let storedConfig = currentAdminConfig;
      if (store) {
        try {
          const loaded = await store.get('credentials', { type: 'json' });
          if (loaded) storedConfig = { ...storedConfig, ...loaded };
        } catch {}
      }

      return new Response(
        JSON.stringify({
          success: true,
          phone: storedConfig.phone,
          displayPhone: `+91 ${storedConfig.phone.slice(0, 5)} ${storedConfig.phone.slice(5)}`,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // POST: Authenticate Admin with Phone + Password
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const body = await req.json();
      const rawPhone = (body.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
      const password = (body.password || '').trim();

      if (!cleanPhone || !password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Please enter both organizer phone number and password.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      let activeConfig = currentAdminConfig;
      if (store) {
        try {
          const loaded = await store.get('credentials', { type: 'json' });
          if (loaded) activeConfig = { ...activeConfig, ...loaded };
        } catch {}
      }

      const cleanConfigPhone = (activeConfig.phone || '').replace(/\D/g, '').slice(-10);
      const isPhoneValid =
        cleanPhone === cleanConfigPhone ||
        activeConfig.fallbackPhones.some((p) => p.replace(/\D/g, '').slice(-10) === cleanPhone);

      const isPasswordValid =
        password === activeConfig.password ||
        activeConfig.fallbackPasswords.includes(password);

      if (isPhoneValid && isPasswordValid) {
        const session = {
          userId: `admin-${cleanPhone}`,
          phone: cleanPhone,
          email: 'organizer@naadansmash.com',
          role: 'organizer',
          fullName: `Organizer (+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)})`,
          loggedInAt: new Date().toISOString(),
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Organizer login successful!',
            role: 'organizer',
            user: session,
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid organizer phone number or password. Please verify and try again.',
        }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // PUT: Update Admin Phone Number and Password
    // -------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = await req.json();
      const newPhone = (body.newPhone || body.phone || '').replace(/\D/g, '').slice(-10);
      const newPassword = (body.newPassword || body.password || '').trim();

      if (newPhone.length !== 10) {
        return new Response(
          JSON.stringify({ success: false, message: 'Admin phone number must be 10 digits.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, message: 'Admin password must be at least 6 characters.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const updated = {
        phone: newPhone,
        password: newPassword,
        fallbackPhones: Array.from(new Set([newPhone, ...currentAdminConfig.fallbackPhones])),
        fallbackPasswords: Array.from(new Set([newPassword, ...currentAdminConfig.fallbackPasswords])),
        updatedAt: new Date().toISOString(),
      };

      currentAdminConfig = updated;

      if (store) {
        try {
          await store.setJSON('credentials', updated);
        } catch (e) {
          console.warn('Failed to persist admin credentials to Blobs', e);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin phone number and password updated successfully.',
          phone: newPhone,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
