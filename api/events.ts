export const config = {
  runtime: 'edge',
};

const EVENTS_STORE_ID = 'ff808181a09d98f701a20984af2b2a21';

const DEFAULT_EVENTS = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Sunday Evening Match Session - Smash Arena',
    description: 'Weekend evening session scheduled by the coach. 3 hours of structured doubles rotations paired by skill level with refreshments included.',
    event_date: '2026-11-29',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Cochin Sports Arena, Edappally, Kochi',
    registration_fee: 250,
    max_participants: 24,
    registration_deadline: '2026-11-29T10:30:00+00:00',
    status: 'published',
    created_at: '2026-11-22T10:44:53.968098+00:00',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Weekend Smash — Session #1 (Inaugural Rally)',
    description: 'The inaugural community match meetup. High-energy rallies, friendly rotations, and post-game coconut water.',
    event_date: '2026-11-15',
    start_time: '17:30:00',
    end_time: '20:30:00',
    venue: 'Smash Point Badminton Arena, Kadavanthra, Kochi',
    registration_fee: 250,
    max_participants: 24,
    registration_deadline: '2026-11-15T12:00:00+00:00',
    status: 'completed',
    isHistorical: true,
    created_at: '2026-11-10T10:00:00+00:00',
  }
];

let memoryEvents: any[] = [...DEFAULT_EVENTS];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function fetchCloudEvents(): Promise<any[]> {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${EVENTS_STORE_ID}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.events && Array.isArray(data.data.events) && data.data.events.length > 0) {
        memoryEvents = data.data.events;
        return data.data.events;
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud events, using memory store:', e);
  }
  return memoryEvents;
}

async function saveCloudEvents(events: any[]): Promise<boolean> {
  memoryEvents = events;
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${EVENTS_STORE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'naadansmash_cloud_events_v1',
        data: { events },
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not save cloud events:', e);
    return false;
  }
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // -------------------------------------------------------------
    // GET: Retrieve all active events
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const events = await fetchCloudEvents();
      return new Response(
        JSON.stringify({
          success: true,
          count: events.length,
          events,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // POST: Create a new event
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const body = await req.json();
      const newEvent = body.event || body;

      if (!newEvent.title) {
        return new Response(
          JSON.stringify({ success: false, message: 'Event title is required.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const currentEvents = await fetchCloudEvents();
      const id = newEvent.id || `event-${Date.now()}`;
      const formattedEvent = {
        ...newEvent,
        id,
        created_at: newEvent.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedList = [formattedEvent, ...currentEvents.filter((e) => e.id !== id)];
      await saveCloudEvents(updatedList);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Event created and synced to cloud store.',
          event: formattedEvent,
        }),
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // PUT: Update an existing event schedule or status
    // -------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = await req.json();
      const eventToUpdate = body.event || body;
      const eventId = eventToUpdate.id || body.id;

      if (!eventId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Event ID is required for update.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const currentEvents = await fetchCloudEvents();
      const idx = currentEvents.findIndex((e) => e.id === eventId);

      let updatedEvent: any = null;
      let newList: any[] = [];

      if (idx >= 0) {
        updatedEvent = {
          ...currentEvents[idx],
          ...eventToUpdate,
          id: currentEvents[idx].id,
          updated_at: new Date().toISOString(),
        };
        newList = [...currentEvents];
        newList[idx] = updatedEvent;
      } else if (currentEvents.length > 0) {
        updatedEvent = {
          ...currentEvents[0],
          ...eventToUpdate,
          id: currentEvents[0].id,
          updated_at: new Date().toISOString(),
        };
        newList = [...currentEvents];
        newList[0] = updatedEvent;
      } else {
        updatedEvent = {
          ...eventToUpdate,
          id: eventId || '22222222-2222-2222-2222-222222222222',
          updated_at: new Date().toISOString(),
        };
        newList = [updatedEvent];
      }

      if (updatedEvent.status === 'published') {
        newList = newList.map((e) => (e.id === updatedEvent.id ? e : { ...e, status: 'completed' }));
      }

      await saveCloudEvents(newList);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Event updated and synced to cloud store.',
          event: updatedEvent,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // DELETE: Delete an event
    // -------------------------------------------------------------
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const eventId = url.searchParams.get('id');

      if (!eventId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Event ID is required.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const currentEvents = await fetchCloudEvents();
      const filtered = currentEvents.filter((e) => e.id !== eventId);
      await saveCloudEvents(filtered);

      return new Response(
        JSON.stringify({ success: true, message: 'Event deleted from cloud store.' }),
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
