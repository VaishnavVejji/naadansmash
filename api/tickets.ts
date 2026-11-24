import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '') || 'https://odnjkvxqypjklsjgxpoj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cYWbnMxIdT996o4RoYu2Aw_FpgHkkVs';

let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseClient;
}

// Universal seed registrations accessible across all devices
const TICKETS_STORE_ID = 'ff808181a09d98f701a2098501bc2a23';

const DEFAULT_SEED_TICKETS: any[] = [
  {
    id: 'reg-demo-001',
    registration_number: 'NS-001',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Test Verification Player',
    email: 'player.verify@naadansmash.com',
    phone: '9998887776',
    skill_level: 'Intermediate',
    playing_category: 'Open Doubles',
    utr_reference: 'TEST12345678',
    payment_status: 'pending',
    registration_status: 'payment_submitted',
    attendance_status: 'registered',
    event_title: 'Sunday Evening Match Session - Smash Arena',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    created_at: '2026-11-22T10:45:00+05:30',
  },
  {
    id: 'reg-demo-002',
    registration_number: 'NS-002',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Rahul Varma',
    email: 'rahul.varma@example.com',
    phone: '9847123456',
    skill_level: 'Advanced',
    playing_category: 'Open Doubles',
    utr_reference: 'UPI9847123456',
    payment_status: 'verified',
    registration_status: 'confirmed',
    attendance_status: 'present',
    event_title: 'Sunday Evening Match Session - Smash Arena',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    created_at: '2026-11-22T09:30:00+05:30',
  },
  {
    id: 'reg-demo-003',
    registration_number: 'NS-003',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Anjali Menon',
    email: 'anjali.menon@example.com',
    phone: '9447654321',
    skill_level: 'Beginner',
    playing_category: 'Open Doubles',
    payment_status: 'pending',
    registration_status: 'received',
    attendance_status: 'registered',
    event_title: 'Sunday Evening Match Session - Smash Arena',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    created_at: '2026-11-22T08:15:00+05:30',
  },
  {
    id: 'reg-demo-004',
    registration_number: 'NS-004',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Kiran Thomas',
    email: 'kiran.thomas@example.com',
    phone: '9846112233',
    skill_level: 'Intermediate',
    playing_category: 'Open Doubles',
    utr_reference: 'INVALIDUTR123',
    payment_status: 'rejected',
    registration_status: 'rejected',
    rejection_reason: '12-digit UTR reference was not found in bank credits.',
    attendance_status: 'registered',
    event_title: 'Sunday Evening Match Session - Smash Arena',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    created_at: '2026-11-22T07:45:00+05:30',
  },
  {
    id: 'reg-demo-007',
    registration_number: 'NS-007',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Rahul Nair',
    phone: '9876543210',
    skill_level: 'Advanced',
    payment_status: 'verified',
    attendance_status: 'present',
    registration_status: 'confirmed',
    event_title: 'Sunday Evening Match Session - Smash Arena',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    created_at: '2026-11-23T10:00:00+05:30',
  }
];

// Fallback in-memory store
const memoryStore = new Map<string, any>();
memoryStore.set('all_registrations', [...DEFAULT_SEED_TICKETS]);
for (const t of DEFAULT_SEED_TICKETS) {
  memoryStore.set(`phone_${t.phone}`, [t]);
  memoryStore.set(`reg_${t.registration_number}`, t);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function formatTicket(t: any): any {
  return {
    ...t,
    registration_number: t.registration_number ? t.registration_number.toUpperCase() : 'NS-001',
    phone: (t.phone || '').replace(/\D/g, '').slice(-10),
    event_title: t.event_title || 'Sunday Evening Match Session - Smash Arena',
    event_date: t.event_date || '2026-11-29',
    start_time: t.start_time || '17:30:00',
    end_time: t.end_time || '20:30:00',
    venue: t.venue || 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: t.registration_fee || 250,
  };
}

async function fetchCloudTickets(): Promise<any[]> {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${TICKETS_STORE_ID}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.tickets && Array.isArray(data.data.tickets) && data.data.tickets.length > 0) {
        memoryStore.set('all_registrations', data.data.tickets);
        return data.data.tickets;
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud tickets:', e);
  }
  return memoryStore.get('all_registrations') || DEFAULT_SEED_TICKETS;
}

async function saveCloudTickets(tickets: any[]): Promise<boolean> {
  memoryStore.set('all_registrations', tickets);
  for (const t of tickets) {
    const phone = (t.phone || '').replace(/\D/g, '').slice(-10);
    const reg = (t.registration_number || '').toUpperCase();
    if (reg) memoryStore.set(`reg_${reg}`, t);
    if (phone) {
      const pList = memoryStore.get(`phone_${phone}`) || [];
      const filtered = pList.filter((x: any) => (x.registration_number || '').toUpperCase() !== reg);
      filtered.unshift(t);
      memoryStore.set(`phone_${phone}`, filtered);
    }
  }
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${TICKETS_STORE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'naadansmash_cloud_tickets_v1',
        data: { tickets },
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not save cloud tickets:', e);
    return false;
  }
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const supabase = getSupabase();

  try {
    const url = new URL(req.url);

    // -------------------------------------------------------------
    // GET: Retrieve tickets by Phone Number, Reg Number, or All
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const q = url.searchParams.get('q')?.trim() || '';
      const cloudTickets = await fetchCloudTickets();

      if (!q) {
        // Return all registered tickets
        const mergedMap = new Map<string, any>();
        for (const seed of DEFAULT_SEED_TICKETS) {
          mergedMap.set(seed.registration_number.toUpperCase(), formatTicket(seed));
        }
        for (const item of cloudTickets) {
          if (item && item.registration_number) {
            mergedMap.set(item.registration_number.toUpperCase(), formatTicket(item));
          }
        }

        const mergedList = Array.from(mergedMap.values());
        return new Response(JSON.stringify({ success: true, count: mergedList.length, tickets: mergedList }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      const digitsOnly = q.replace(/\D/g, '');
      const isPhone = digitsOnly.length >= 10;
      const cleanPhone = isPhone ? digitsOnly.slice(-10) : '';
      const cleanReg = q.toUpperCase();

      const matchedTicketsMap = new Map<string, any>();

      // 1. Check Cloud Tickets
      for (const item of cloudTickets) {
        const itemPhone = (item.phone || '').replace(/\D/g, '').slice(-10);
        const itemReg = (item.registration_number || '').toUpperCase();
        if ((cleanPhone && (itemPhone === cleanPhone || itemPhone.endsWith(cleanPhone) || cleanPhone.endsWith(itemPhone))) ||
            itemReg === cleanReg) {
          matchedTicketsMap.set(itemReg, formatTicket(item));
        }
      }

      // 2. Check Supabase
      if (matchedTicketsMap.size === 0 && supabase) {
        try {
          if (cleanPhone) {
            const { data } = await supabase.from('registrations').select('*').ilike('phone', `%${cleanPhone}%`);
            if (data && data.length > 0) {
              for (const item of data) {
                matchedTicketsMap.set(item.registration_number.toUpperCase(), formatTicket(item));
              }
            }
          }
          if (matchedTicketsMap.size === 0) {
            const { data } = await supabase.from('registrations').select('*').ilike('registration_number', cleanReg);
            if (data && data.length > 0) {
              for (const item of data) {
                matchedTicketsMap.set(item.registration_number.toUpperCase(), formatTicket(item));
              }
            }
          }
        } catch (err) {
          console.warn('Supabase GET tickets error:', err);
        }
      }

      // 3. Check DEFAULT_SEED_TICKETS fallback
      if (matchedTicketsMap.size === 0) {
        for (const item of DEFAULT_SEED_TICKETS) {
          const itemPhone = item.phone.replace(/\D/g, '').slice(-10);
          const itemReg = item.registration_number.toUpperCase();
          if ((cleanPhone && (itemPhone === cleanPhone || itemPhone.endsWith(cleanPhone) || cleanPhone.endsWith(itemPhone))) ||
              itemReg === cleanReg) {
            matchedTicketsMap.set(itemReg, formatTicket(item));
          }
        }
      }

      const tickets = Array.from(matchedTicketsMap.values());

      return new Response(
        JSON.stringify({
          success: true,
          found: tickets.length > 0,
          count: tickets.length,
          tickets,
          registration: tickets[0] || null,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // POST: Save or Register a Ticket (Cross-device cloud persistence)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const body = await req.json();
      const reg = body.registration || body;
      const phone = (reg.phone || body.phone || '').replace(/\D/g, '').slice(-10);
      const regNumber = (reg.registration_number || body.regNumber || '').toUpperCase();

      if (!regNumber || !phone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Both registration_number and phone are required.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const ticketRecord = formatTicket({
        ...reg,
        registration_number: regNumber,
        phone,
        updated_at: new Date().toISOString(),
      });

      // 1. Save in Cloud store
      const currentList = await fetchCloudTickets();
      const filtered = currentList.filter(
        (t: any) => (t.registration_number || '').toUpperCase() !== regNumber
      );
      filtered.unshift(ticketRecord);
      await saveCloudTickets(filtered);

      // 2. Save in Supabase
      if (supabase) {
        try {
          await supabase.from('registrations').upsert(ticketRecord);
        } catch (e) {
          console.warn('Supabase upsert error:', e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Ticket registered in cloud sync store.', ticket: ticketRecord }),
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // PUT: Update Payment or Attendance Status
    // -------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = await req.json();
      const regNumber = (body.registration_number || body.regNumber || '').toUpperCase();
      const regId = body.id || body.regId;
      const cleanPhone = (body.phone || '').replace(/\D/g, '').slice(-10);

      if (!regNumber && !regId && !cleanPhone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Registration number, ID, or phone required for update.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      let allRegs: any[] = await fetchCloudTickets();
      const idx = allRegs.findIndex(
        (r: any) =>
          (regId && r.id === regId) ||
          (regNumber && (r.registration_number || '').toUpperCase() === regNumber) ||
          (cleanPhone && (r.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
      );

      let target: any = null;
      if (idx >= 0) {
        target = { ...allRegs[idx], ...body, updated_at: new Date().toISOString() };
        allRegs[idx] = target;

        await saveCloudTickets(allRegs);

        if (supabase) {
          try {
            await supabase.from('registrations').update(target).eq('registration_number', target.registration_number);
          } catch {}
        }

        return new Response(JSON.stringify({ success: true, updated: target }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      return new Response(JSON.stringify({ success: false, message: 'Ticket not found for update.' }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // -------------------------------------------------------------
    // DELETE: Delete a registration or purge event
    // -------------------------------------------------------------
    if (req.method === 'DELETE') {
      const regId = url.searchParams.get('id');
      const regNumber = url.searchParams.get('reg')?.toUpperCase();
      const eventId = url.searchParams.get('eventId');
      const purgeScreenshots = url.searchParams.get('purgeScreenshots') === 'true';

      let allRegs: any[] = await fetchCloudTickets();

      if (purgeScreenshots && eventId) {
        allRegs = allRegs.map((r: any) => (r.event_id === eventId ? { ...r, payment_screenshot_path: null } : r));
      } else if (eventId && !regId && !regNumber) {
        allRegs = allRegs.filter((r: any) => r.event_id !== eventId);
      } else if (regId || regNumber) {
        allRegs = allRegs.filter(
          (r: any) =>
            (!regId || r.id !== regId) &&
            (!regNumber || (r.registration_number || '').toUpperCase() !== regNumber)
        );
      }

      await saveCloudTickets(allRegs);

      if (supabase) {
        try {
          if (regId) await supabase.from('registrations').delete().eq('id', regId);
          else if (regNumber) await supabase.from('registrations').delete().eq('registration_number', regNumber);
          else if (eventId) await supabase.from('registrations').delete().eq('event_id', eventId);
        } catch {}
      }

      return new Response(JSON.stringify({ success: true, message: 'Registration deleted from cloud store.' }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
