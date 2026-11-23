import { getStore } from '@netlify/blobs';

// Fallback in-memory store for local development or environments without Netlify Blobs
const memoryStore = new Map<string, any>();

function getTicketStore() {
  try {
    return getStore({ name: 'naadansmash_tickets', consistency: 'strong' });
  } catch {
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const store = getTicketStore();

  try {
    const url = new URL(req.url);

    // -------------------------------------------------------------
    // GET: Retrieve tickets by Phone Number, Reg Number, or All
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const q = url.searchParams.get('q')?.trim() || '';

      if (!q) {
        // Return all registered tickets (for roster sync)
        let allRegs: any[] = [];
        if (store) {
          try {
            allRegs = (await store.get('all_registrations', { type: 'json' })) || [];
          } catch {}
        } else {
          allRegs = memoryStore.get('all_registrations') || [];
        }
        return new Response(JSON.stringify({ success: true, count: allRegs.length, tickets: allRegs }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      const digitsOnly = q.replace(/\D/g, '');
      const isPhone = digitsOnly.length >= 10;
      const cleanPhone = isPhone ? digitsOnly.slice(-10) : '';
      const cleanReg = q.toUpperCase();

      let tickets: any[] = [];

      if (store) {
        try {
          if (cleanPhone) {
            const byPhone = (await store.get(`phone_${cleanPhone}`, { type: 'json' })) || [];
            tickets = Array.isArray(byPhone) ? byPhone : [byPhone];
          }

          if (tickets.length === 0) {
            const byReg = await store.get(`reg_${cleanReg}`, { type: 'json' });
            if (byReg) tickets.push(byReg);
          }

          if (tickets.length === 0) {
            const allRegs: any[] = (await store.get('all_registrations', { type: 'json' })) || [];
            tickets = allRegs.filter((item: any) => {
              const itemPhone = (item.phone || '').replace(/\D/g, '').slice(-10);
              const itemReg = (item.registration_number || '').toUpperCase();
              return (cleanPhone && itemPhone === cleanPhone) || itemReg === cleanReg;
            });
          }
        } catch (err) {
          console.warn('Netlify blobs GET error, fallback to memory', err);
        }
      }

      if (tickets.length === 0) {
        if (cleanPhone) {
          const byPhone = memoryStore.get(`phone_${cleanPhone}`) || [];
          tickets = Array.isArray(byPhone) ? byPhone : [byPhone];
        }
        if (tickets.length === 0) {
          const byReg = memoryStore.get(`reg_${cleanReg}`);
          if (byReg) tickets.push(byReg);
        }
        if (tickets.length === 0) {
          const allRegs: any[] = memoryStore.get('all_registrations') || [];
          tickets = allRegs.filter((item: any) => {
            const itemPhone = (item.phone || '').replace(/\D/g, '').slice(-10);
            const itemReg = (item.registration_number || '').toUpperCase();
            return (cleanPhone && itemPhone === cleanPhone) || itemReg === cleanReg;
          });
        }
      }

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

      const ticketRecord = {
        ...reg,
        registration_number: regNumber,
        phone,
        updated_at: new Date().toISOString(),
      };

      // 1. Save in Netlify Blobs
      if (store) {
        try {
          // Add to phone list
          const existingPhoneTickets: any[] = (await store.get(`phone_${phone}`, { type: 'json' })) || [];
          const filteredPhone = existingPhoneTickets.filter(
            (t: any) => (t.registration_number || '').toUpperCase() !== regNumber
          );
          filteredPhone.unshift(ticketRecord);
          await store.setJSON(`phone_${phone}`, filteredPhone);

          // Save direct reg index
          await store.setJSON(`reg_${regNumber}`, ticketRecord);

          // Add to all_registrations
          const allRegs: any[] = (await store.get('all_registrations', { type: 'json' })) || [];
          const filteredAll = allRegs.filter(
            (t: any) => (t.registration_number || '').toUpperCase() !== regNumber
          );
          filteredAll.unshift(ticketRecord);
          await store.setJSON('all_registrations', filteredAll);
        } catch (e) {
          console.warn('Netlify blobs POST error', e);
        }
      }

      // 2. Save in memory store
      const memPhoneTickets = memoryStore.get(`phone_${phone}`) || [];
      const filteredMemPhone = memPhoneTickets.filter(
        (t: any) => (t.registration_number || '').toUpperCase() !== regNumber
      );
      filteredMemPhone.unshift(ticketRecord);
      memoryStore.set(`phone_${phone}`, filteredMemPhone);
      memoryStore.set(`reg_${regNumber}`, ticketRecord);

      const memAll = memoryStore.get('all_registrations') || [];
      const filteredMemAll = memAll.filter(
        (t: any) => (t.registration_number || '').toUpperCase() !== regNumber
      );
      filteredMemAll.unshift(ticketRecord);
      memoryStore.set('all_registrations', filteredMemAll);

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

      if (!regNumber && !regId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Registration number or ID required for update.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      let target: any = null;
      let allRegs: any[] = [];

      if (store) {
        try {
          allRegs = (await store.get('all_registrations', { type: 'json' })) || [];
        } catch {}
      } else {
        allRegs = memoryStore.get('all_registrations') || [];
      }

      const idx = allRegs.findIndex(
        (r: any) =>
          (regNumber && (r.registration_number || '').toUpperCase() === regNumber) ||
          (regId && r.id === regId)
      );

      if (idx >= 0) {
        target = { ...allRegs[idx], ...body, updated_at: new Date().toISOString() };
        allRegs[idx] = target;

        const phone = (target.phone || '').replace(/\D/g, '').slice(-10);
        const cleanReg = (target.registration_number || '').toUpperCase();

        if (store) {
          try {
            await store.setJSON('all_registrations', allRegs);
            if (cleanReg) await store.setJSON(`reg_${cleanReg}`, target);
            if (phone) {
              const phoneList: any[] = (await store.get(`phone_${phone}`, { type: 'json' })) || [];
              const pIdx = phoneList.findIndex(
                (p: any) => (p.registration_number || '').toUpperCase() === cleanReg
              );
              if (pIdx >= 0) phoneList[pIdx] = target;
              else phoneList.unshift(target);
              await store.setJSON(`phone_${phone}`, phoneList);
            }
          } catch {}
        }

        memoryStore.set('all_registrations', allRegs);
        if (cleanReg) memoryStore.set(`reg_${cleanReg}`, target);
        if (phone) {
          const phoneList: any[] = memoryStore.get(`phone_${phone}`) || [];
          const pIdx = phoneList.findIndex((p: any) => (p.registration_number || '').toUpperCase() === cleanReg);
          if (pIdx >= 0) phoneList[pIdx] = target;
          else phoneList.unshift(target);
          memoryStore.set(`phone_${phone}`, phoneList);
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
      const phone = url.searchParams.get('phone')?.replace(/\D/g, '').slice(-10);
      const eventId = url.searchParams.get('eventId');
      const purgeScreenshots = url.searchParams.get('purgeScreenshots') === 'true';

      let allRegs: any[] = [];
      if (store) {
        try {
          allRegs = (await store.get('all_registrations', { type: 'json' })) || [];
        } catch {}
      } else {
        allRegs = memoryStore.get('all_registrations') || [];
      }

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

      if (store) {
        try {
          await store.setJSON('all_registrations', allRegs);
          if (regNumber) await store.delete(`reg_${regNumber}`);
          if (phone) {
            const phoneList: any[] = (await store.get(`phone_${phone}`, { type: 'json' })) || [];
            const filteredPhone = phoneList.filter(
              (r: any) => (!regId || r.id !== regId) && (!regNumber || (r.registration_number || '').toUpperCase() !== regNumber)
            );
            await store.setJSON(`phone_${phone}`, filteredPhone);
          }
        } catch {}
      }

      memoryStore.set('all_registrations', allRegs);

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
};
