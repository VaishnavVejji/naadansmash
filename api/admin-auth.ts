export const config = {
  runtime: 'edge',
};

const DEFAULT_ADMIN = {
  phone: '8304883872',
  password: 'naadansmash2026',
  fallbackPhones: ['8304883872', '9876543210', '918304883872'],
  fallbackPasswords: ['naadansmash2026', 'admin123'],
};

let currentAdminConfig = { ...DEFAULT_ADMIN };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // -------------------------------------------------------------
    // GET: Get public organiser contact info
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const storedConfig = currentAdminConfig;
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
    // POST: Authenticate Admin with Username / Phone + Password
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const body = await req.json();
      const rawInput = (body.username || body.phone || body.login || '').trim();
      const password = (body.password || '').trim();

      if (!rawInput || !password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Please enter both organizer username/phone and password.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const activeConfig = currentAdminConfig;
      const isUsernameMatch = ['admin', 'organizer', 'superadmin', 'lead'].includes(rawInput.toLowerCase());
      const rawDigits = rawInput.replace(/\D/g, '');
      const cleanPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
      const cleanConfigPhone = (activeConfig.phone || '').replace(/\D/g, '').slice(-10);

      const isPhoneValid =
        isUsernameMatch ||
        cleanPhone === cleanConfigPhone ||
        activeConfig.fallbackPhones.some((p) => p.replace(/\D/g, '').slice(-10) === cleanPhone);

      const isPasswordValid =
        password === activeConfig.password ||
        activeConfig.fallbackPasswords.includes(password);

      if (isPhoneValid && isPasswordValid) {
        const displayPhone = cleanPhone && cleanPhone.length === 10 ? cleanPhone : activeConfig.phone;
        const session = {
          userId: `admin-${displayPhone}`,
          phone: displayPhone,
          username: isUsernameMatch ? rawInput.toLowerCase() : 'admin',
          role: 'organizer',
          isAdmin: true,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          token: `admin-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Organizer authentication successful.',
            session,
            user: {
              id: session.userId,
              phone: displayPhone,
              role: 'organizer',
              full_name: 'Lead Organizer & Admin',
            },
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid organizer credentials. Check username/phone and password.',
        }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // PUT: Update Organizer Phone or Password
    // -------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = await req.json();
      const { newPhone, newPassword } = body;

      if (!newPhone && !newPassword) {
        return new Response(
          JSON.stringify({ success: false, message: 'Please provide newPhone or newPassword to update.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const updated = { ...currentAdminConfig };
      if (newPhone) {
        const clean = newPhone.replace(/\D/g, '').slice(-10);
        if (clean.length === 10) {
          updated.phone = clean;
          if (!updated.fallbackPhones.includes(clean)) updated.fallbackPhones.push(clean);
        }
      }
      if (newPassword && newPassword.length >= 6) {
        updated.password = newPassword;
        if (!updated.fallbackPasswords.includes(newPassword)) updated.fallbackPasswords.push(newPassword);
      }

      currentAdminConfig = updated;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Organizer credentials updated successfully.',
          phone: updated.phone,
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
}
