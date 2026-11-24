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

const DEFAULT_SEED_TICKETS: any[] = [];

// Fallback in-memory store
const memoryStore = new Map<string, any>();
memoryStore.set('all_registrations', []);

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
      if (data?.data && Array.isArray(data.data.tickets)) {
        memoryStore.set('all_registrations', data.data.tickets);
        return data.data.tickets;
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud tickets:', e);
  }
  return memoryStore.get('all_registrations') || [];
}

async function saveCloudTickets(tickets: any[]): Promise<boolean> {
  memoryStore.set('all_registrations', tickets);
  if (tickets.length === 0) {
    memoryStore.clear();
  } else {
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
    if (!res.ok) {
      // If payload is too large, strip heavy screenshots to guarantee player registration sync
      const leanTickets = tickets.map((t: any) => ({
        ...t,
        payment_screenshot_path: t.payment_screenshot_path && t.payment_screenshot_path.length > 5000 ? null : t.payment_screenshot_path,
      }));
      const retryRes = await fetch(`https://api.restful-api.dev/objects/${TICKETS_STORE_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'naadansmash_cloud_tickets_v1',
          data: { tickets: leanTickets },
        }),
      });
      return retryRes.ok;
    }
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
        // 1. Primary: Direct query from Supabase database
        if (supabase) {
          try {
            let sQuery = supabase.from('registrations').select('*').order('created_at', { ascending: false });
            const eventIdFilter = url.searchParams.get('eventId');
            if (eventIdFilter && eventIdFilter !== 'all') {
              sQuery = sQuery.eq('event_id', eventIdFilter);
            }
            const { data, error } = await sQuery;
            if (!error && Array.isArray(data) && data.length > 0) {
              const formatted = data.map(formatTicket);
              return new Response(JSON.stringify({ success: true, count: formatted.length, tickets: formatted }), {
                status: 200,
                headers: CORS_HEADERS,
              });
            }
          } catch (e) {
            console.warn('Supabase fetch error in tickets API:', e);
          }
        }

        // 2. Return registered tickets from cloud store
        const listToReturn = Array.isArray(cloudTickets) ? cloudTickets.map(formatTicket) : [];

        const eventIdFilter = url.searchParams.get('eventId');
        let filtered = listToReturn;
        if (eventIdFilter && eventIdFilter !== 'all') {
          filtered = filtered.filter((t: any) => !t.event_id || t.event_id === eventIdFilter);
        }

        return new Response(JSON.stringify({ success: true, count: filtered.length, tickets: filtered }), {
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
      const clearAll = url.searchParams.get('clearAll') === 'true';

      let allRegs: any[] = await fetchCloudTickets();

      if (purgeScreenshots && eventId) {
        allRegs = allRegs.map((r: any) => (r.event_id === eventId ? { ...r, payment_screenshot_path: null } : r));
      } else if (clearAll || eventId === 'all') {
        allRegs = [];
      } else if (eventId && !regId && !regNumber) {
        allRegs = allRegs.filter((r: any) => r.event_id && r.event_id !== eventId);
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
          else if (eventId && eventId !== 'all') await supabase.from('registrations').delete().eq('event_id', eventId);
          else if (clearAll || eventId === 'all') await supabase.from('registrations').delete().not('id', 'is', null);
        } catch (e) {
          console.warn('Supabase delete error:', e);
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Registrations updated in cloud store.' }), {
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
