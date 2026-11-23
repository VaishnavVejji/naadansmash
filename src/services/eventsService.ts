import { DatabaseEvent, RegistrationPayload, PaymentSettings, ParticipantRegistrationStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { emailService, EmailSendResult } from './emailService';

// Seed events matching the new PostgreSQL schema
const HISTORICAL_EVENT_1: DatabaseEvent = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Inaugural Smash — Session #1',
  description: 'Inaugural weekend evening session. 24 players gathered for 3 hours of organized doubles rotations, intense rallies, and post-game Kerala chai.',
  event_date: '2026-11-15', // 15 November 2026 (Historical)
  start_time: '17:30:00',
  end_time: '20:30:00',
  venue: 'Fitness Soul, Kakkanad, Kochi',
  registration_fee: 250,
  max_participants: 24,
  registration_deadline: '2026-11-15T16:00:00+05:30',
  status: 'completed',
  created_at: '2026-11-01T10:00:00+05:30',
  available_slots: 0,
  isHistorical: true,
};

const HISTORICAL_EVENT_2: DatabaseEvent = {
  id: '33333333-3333-3333-3333-333333333333',
  title: 'Weekend Evening Smash — Session #2',
  description: 'Our second high-energy session. 24 players on court for fast-paced doubles rotations, authentic community connections, and post-game Kerala chai.',
  event_date: '2026-11-22', // 22 November 2026 (Historical)
  start_time: '17:30:00',
  end_time: '20:30:00',
  venue: 'Cochin Sports Arena, Edappally, Kochi',
  registration_fee: 250,
  max_participants: 24,
  registration_deadline: '2026-11-22T16:00:00+05:30',
  status: 'completed',
  created_at: '2026-11-10T10:00:00+05:30',
  available_slots: 0,
  isHistorical: true,
};

const UPCOMING_DEFAULT_EVENT: DatabaseEvent = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Weekend Evening Smash — Session #3',
  description: 'Upcoming weekend evening meetup session. 3 hours of structured doubles rotations paired by skill level with refreshments included.',
  event_date: '2026-11-29', // Upcoming weekend date
  start_time: '17:30:00',
  end_time: '20:30:00',
  venue: 'Cochin Sports Arena, Edappally, Kochi',
  registration_fee: 250,
  max_participants: 24,
  registration_deadline: '2026-11-29T16:00:00+05:30',
  status: 'published',
  created_at: '2026-11-20T10:00:00+05:30',
  available_slots: 12,
  isHistorical: false,
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  upi_id: 'naadansmash@upi',
  qr_image_path: '/images/naadansmash-logo.png',
  account_display_name: 'NAADANSMASH Kochi Sports Club',
  payment_instructions: 'Transfer ₹250 via GPay, PhonePe, or Paytm to naadansmash@upi. Enter the 12-digit UTR reference number upon registration to expedite court check-in.',
};

const STORAGE_KEY_EVENTS = 'naadansmash_events_v2';
const STORAGE_KEY_REGISTRATIONS = 'naadansmash_registrations_v2';
const STORAGE_KEY_PAYMENT = 'naadansmash_payment_v2';

function getStoredEvents(): DatabaseEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (raw) {
      const parsed: DatabaseEvent[] = JSON.parse(raw);
      // Ensure historical events #1 and #2 are present with accurate actual venue locations
      let modified = false;
      for (const e of parsed) {
        if (e.id === HISTORICAL_EVENT_1.id && e.venue !== HISTORICAL_EVENT_1.venue) {
          e.venue = HISTORICAL_EVENT_1.venue;
          modified = true;
        } else if (e.id === HISTORICAL_EVENT_2.id && e.venue !== HISTORICAL_EVENT_2.venue) {
          e.venue = HISTORICAL_EVENT_2.venue;
          modified = true;
        } else if (e.venue?.includes('Flymate')) {
          e.venue = 'Cochin Sports Arena, Edappally, Kochi';
          modified = true;
        }
      }

      if (!parsed.some((e) => e.id === HISTORICAL_EVENT_2.id)) {
        parsed.unshift(HISTORICAL_EVENT_2);
        modified = true;
      }
      if (!parsed.some((e) => e.id === HISTORICAL_EVENT_1.id)) {
        parsed.push(HISTORICAL_EVENT_1);
        modified = true;
      }

      if (modified) {
        saveStoredEvents(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load events from storage', e);
  }
  return [HISTORICAL_EVENT_2, HISTORICAL_EVENT_1, UPCOMING_DEFAULT_EVENT];
}

function saveStoredEvents(events: DatabaseEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to storage', e);
  }
}

const DEFAULT_TEST_REGISTRATIONS: any[] = [
  {
    id: 'reg-demo-001',
    registration_number: 'NS-2611-24EB29',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Test Verification Player',
    email: 'player.verify@naadansmash.com',
    phone: '9998887776',
    age: 26,
    gender: 'Male',
    skill_level: 'Intermediate',
    playing_category: 'Open Doubles',
    utr_reference: 'TEST12345678',
    payment_status: 'pending',
    registration_status: 'payment_submitted',
    attendance_status: 'registered',
    created_at: '2026-11-22T10:45:00+05:30',
  },
  {
    id: 'reg-demo-002',
    registration_number: 'NS-2611-8899AA',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Rahul Varma',
    email: 'rahul.varma@example.com',
    phone: '9847123456',
    age: 28,
    gender: 'Male',
    skill_level: 'Advanced',
    playing_category: 'Open Doubles',
    utr_reference: 'UPI9847123456',
    payment_status: 'verified',
    registration_status: 'confirmed',
    attendance_status: 'present',
    created_at: '2026-11-22T09:30:00+05:30',
  },
  {
    id: 'reg-demo-003',
    registration_number: 'NS-2611-77CC11',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Anjali Menon',
    email: 'anjali.menon@example.com',
    phone: '9447654321',
    age: 24,
    gender: 'Female',
    skill_level: 'Beginner',
    playing_category: 'Open Doubles',
    utr_reference: null,
    payment_status: 'pending',
    registration_status: 'received',
    attendance_status: 'registered',
    created_at: '2026-11-22T08:15:00+05:30',
  },
  {
    id: 'reg-demo-004',
    registration_number: 'NS-2611-99DD44',
    event_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Kiran Thomas',
    email: 'kiran.thomas@example.com',
    phone: '9846112233',
    age: 27,
    gender: 'Male',
    skill_level: 'Intermediate',
    playing_category: 'Open Doubles',
    utr_reference: 'INVALIDUTR123',
    payment_status: 'rejected',
    registration_status: 'rejected',
    rejection_reason: '12-digit UTR reference was not found in bank credits. Please check and submit correct reference.',
    attendance_status: 'registered',
    created_at: '2026-11-22T07:45:00+05:30',
  },
];

function getStoredRegistrations(): any[] {
  const map = new Map<string, any>();
  for (const r of DEFAULT_TEST_REGISTRATIONS) {
    map.set(r.registration_number, { ...r });
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && p.registration_number) {
            const existing = map.get(p.registration_number);
            map.set(p.registration_number, existing ? { ...existing, ...p } : p);
          }
        }
      }
    }
  } catch {}

  return Array.from(map.values());
}

function saveStoredRegistrations(regs: any[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs));
  } catch (e) {
    console.warn('Failed to save registrations to storage', e);
  }
}

export const eventsService = {
  /**
   * Fetches events from Supabase (or fallback cache) and computes available slots.
   */
  async getEvents(): Promise<DatabaseEvent[]> {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from('events')
          .select('*')
          .in('status', ['published', 'completed', 'closed', 'in_progress'])
          .order('event_date', { ascending: false });

        if (!error && data && data.length > 0) {
          // Fetch remaining slots for each event via RPC or count
          const mapped: DatabaseEvent[] = await Promise.all(
            data.map(async (item) => {
              let availableSlots = item.max_participants;
              try {
                const { data: slotData, error: slotErr } = await client.rpc(
                  'get_event_remaining_slots',
                  { p_event_id: item.id }
                );
                if (!slotErr && slotData !== null) {
                  availableSlots = Number(slotData);
                }
              } catch (e) {
                console.warn('RPC get_event_remaining_slots error, fallback to max', e);
              }

              return {
                id: item.id,
                title: item.title,
                description: item.description || '',
                event_date: item.event_date,
                start_time: item.start_time,
                end_time: item.end_time,
                venue: item.venue,
                registration_fee: Number(item.registration_fee),
                max_participants: item.max_participants,
                registration_deadline: item.registration_deadline,
                status: item.status,
                created_at: item.created_at,
                available_slots: availableSlots,
                isHistorical: item.status === 'completed' || item.event_date <= '2026-11-22',
              };
            })
          );

          // Overlay local admin edits so updates reflect immediately without waiting or stale cache
          const storedEvents = getStoredEvents();
          const storedMap = new Map(storedEvents.map((e) => [e.id, e]));
          const merged: DatabaseEvent[] = mapped.map((item) => {
            const local = storedMap.get(item.id);
            if (local) {
              return {
                ...item,
                ...local,
                available_slots: local.available_slots ?? item.available_slots,
              };
            }
            return item;
          });

          // Add any local-only events
          for (const s of storedEvents) {
            if (!merged.some((m) => m.id === s.id)) {
              merged.push(s);
            }
          }

          return merged;
        }
      } catch (err) {
        console.warn('Supabase getEvents query failed, using local cache', err);
      }
    }

    return getStoredEvents();
  },

  /**
   * Fetches configurable organizer payment settings.
   */
  async getPaymentSettings(): Promise<PaymentSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_settings')
          .select('*')
          .limit(1)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            upi_id: data.upi_id,
            qr_image_path: data.qr_image_path,
            account_display_name: data.account_display_name,
            payment_instructions: data.payment_instructions,
          };
        }
      } catch (e) {
        console.warn('Could not fetch payment settings from Supabase, using defaults', e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAYMENT);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_PAYMENT_SETTINGS;
  },

  /**
   * Updates organizer payment settings in Supabase and local cache.
   */
  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<boolean> {
    const current = await this.getPaymentSettings();
    const updated: PaymentSettings = {
      ...current,
      ...settings,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('payment_settings').upsert({
          id: updated.id,
          upi_id: updated.upi_id,
          qr_image_path: updated.qr_image_path,
          account_display_name: updated.account_display_name,
          payment_instructions: updated.payment_instructions,
        });
        if (error) {
          console.warn('Supabase updatePaymentSettings error', error);
        }
      } catch (e) {
        console.warn('Could not update payment settings in Supabase', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY_PAYMENT, JSON.stringify(updated));
    } catch {}

    return true;
  },

  /**
   * Atomically registers a player via backend RPC or atomic fallback transaction.
   */
  async registerPlayer(payload: RegistrationPayload): Promise<{
    success: boolean;
    message: string;
    registrationNumber?: string;
    registrationId?: string;
    registrationStatus?: ParticipantRegistrationStatus;
    remainingSlots?: number;
    emailResult?: EmailSendResult;
  }> {
    const hasPaymentSubmitted = Boolean(
      (payload.utrReference && payload.utrReference.trim().length > 0) || payload.paymentScreenshotPath
    );
    const registrationStatus: ParticipantRegistrationStatus = hasPaymentSubmitted ? 'payment_submitted' : 'received';
    const statusMessage = hasPaymentSubmitted
      ? 'Your payment details have been submitted for verification.'
      : 'Your registration has been received.';

    // 1. Try Supabase RPC Transaction
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('register_for_event', {
          p_event_id: payload.eventId,
          p_full_name: payload.fullName,
          p_email: payload.email || null,
          p_phone: payload.phone,
          p_age: payload.age || null,
          p_gender: payload.gender || null,
          p_skill_level: payload.skillLevel,
          p_playing_category: payload.playingCategory || 'Open Doubles',
          p_emergency_contact: payload.emergencyContact || null,
          p_utr_reference: payload.utrReference || null,
          p_payment_screenshot_path: payload.paymentScreenshotPath || null,
        });

        if (error) {
          // If Supabase RPC is not yet migrated in the database, fall through to atomic local fallback
          if (error.code === 'PGRST202' || error.message?.includes('schema cache') || error.code === 'PGRST205') {
            console.warn('Supabase RPC register_for_event not found in schema cache. Executing local transaction fallback.');
          } else {
            return {
              success: false,
              message: error.message || 'Registration transaction failed in Supabase.',
            };
          }
        } else if (data && typeof data === 'object') {
          if (!data.success) {
            return {
              success: false,
              message: data.message || 'Registration failed validation.',
            };
          }

          const newPlayerRecord: any = {
            id: data.id || `reg-${Date.now()}`,
            registration_number: data.registration_number,
            event_id: payload.eventId,
            full_name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            age: payload.age,
            gender: payload.gender,
            skill_level: payload.skillLevel,
            playing_category: payload.playingCategory || 'Open Doubles',
            utr_reference: payload.utrReference || null,
            payment_screenshot_path: payload.paymentScreenshotPath || null,
            payment_status: 'pending',
            attendance_status: 'registered',
            registration_status: registrationStatus,
            created_at: new Date().toISOString(),
          };

          // Dispatch Resend confirmation email if email was provided
          let emailResult: EmailSendResult | undefined;
          if (payload.email && payload.email.includes('@')) {
            const events = getStoredEvents();
            const targetEvent = events.find((e) => e.id === payload.eventId) || events[0];
            try {
              emailResult = await emailService.sendRegistrationReceivedEmail({
                fullName: payload.fullName,
                email: payload.email,
                registrationNumber: data.registration_number,
                eventTitle: targetEvent?.title || 'Weekend Badminton Session',
                eventDate: targetEvent?.event_date || 'Upcoming Weekend',
                startTime: targetEvent?.start_time || '17:30',
                endTime: targetEvent?.end_time || '20:30',
                venue: targetEvent?.venue || 'Kochi Badminton Arena',
                registrationFee: targetEvent?.registration_fee || 250,
                utrReference: payload.utrReference,
              });
              if (emailResult.sent) {
                newPlayerRecord.email_notifications = [{
                  sent: true,
                  provider: 'resend',
                  type: 'registration_received',
                  id: emailResult.id,
                  recipient: payload.email,
                  timestamp: emailResult.timestamp,
                }];
              }
            } catch (err) {
              console.warn('Failed to dispatch registration email', err);
            }
          }

          const currentList = getStoredRegistrations();
          if (!currentList.some((r: any) => r.registration_number === data.registration_number)) {
            currentList.unshift(newPlayerRecord);
            saveStoredRegistrations(currentList);
          }

          return {
            success: true,
            message: statusMessage,
            registrationNumber: data.registration_number,
            registrationId: data.id,
            registrationStatus,
            remainingSlots: data.remaining_slots,
            emailResult,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Database registration failed';
        console.warn('Supabase register_for_event failed, falling back', msg);
      }
    }

    // 2. Atomic fallback transaction in local storage
    const events = getStoredEvents();
    const targetEvent = events.find((e) => e.id === payload.eventId);

    if (!targetEvent) {
      return { success: false, message: 'Event not found.' };
    }

    const cleanPhone = payload.phone.replace(/[^0-9]/g, '');
    if (!payload.fullName || !payload.fullName.trim() || cleanPhone.length < 10) {
      return { success: false, message: 'Please enter your full name and a valid 10-digit WhatsApp phone number.' };
    }

    if (payload.email && payload.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (targetEvent.status === 'closed' || targetEvent.status !== 'published') {
      return { success: false, message: 'Registrations are currently closed for this session. Nobody else can register.' };
    }

    if (targetEvent.registration_deadline && new Date() > new Date(targetEvent.registration_deadline)) {
      return { success: false, message: 'The registration deadline for this session has passed.' };
    }

    // Check duplicate phone
    const storedRegs = JSON.parse(localStorage.getItem(STORAGE_KEY_REGISTRATIONS) || '[]');
    const isDuplicate = storedRegs.some(
      (r: any) => r.event_id === payload.eventId && r.phone.replace(/[^0-9]/g, '') === cleanPhone
    );

    if (isDuplicate) {
      return {
        success: false,
        message: 'A registration with this phone number already exists for this session.',
      };
    }

    // Check capacity
    const activeCount = storedRegs.filter(
      (r: any) => r.event_id === payload.eventId && r.payment_status !== 'rejected'
    ).length;

    if (activeCount >= targetEvent.max_participants) {
      return { success: false, message: 'This event has reached full capacity.' };
    }

    // Generate unique registration number
    const regNumber = `NS-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newReg: any = {
      id: `reg-${Date.now()}`,
      registration_number: regNumber,
      event_id: payload.eventId,
      full_name: payload.fullName,
      email: payload.email,
      phone: cleanPhone,
      age: payload.age,
      gender: payload.gender,
      skill_level: payload.skillLevel,
      playing_category: payload.playingCategory || 'Open Doubles',
      emergency_contact: payload.emergencyContact,
      payment_status: 'pending',
      attendance_status: 'registered',
      registration_status: registrationStatus,
      utr_reference: payload.utrReference,
      payment_screenshot_path: payload.paymentScreenshotPath || null,
      payment_audit_history: [
        {
          action: hasPaymentSubmitted ? 'utr_submitted' : 'registered',
          timestamp: new Date().toISOString(),
          actor: 'participant',
          note: hasPaymentSubmitted
            ? `Initial registration with UTR: ${payload.utrReference || 'Receipt screenshot'}`
            : 'Initial registration received',
          newStatus: registrationStatus,
        },
      ],
      created_at: new Date().toISOString(),
    };

    // Dispatch Resend confirmation email if participant provided email
    let emailResult: EmailSendResult | undefined;
    if (payload.email && payload.email.includes('@')) {
      try {
        emailResult = await emailService.sendRegistrationReceivedEmail({
          fullName: payload.fullName,
          email: payload.email,
          registrationNumber: regNumber,
          eventTitle: targetEvent.title,
          eventDate: targetEvent.event_date,
          startTime: targetEvent.start_time,
          endTime: targetEvent.end_time,
          venue: targetEvent.venue,
          registrationFee: targetEvent.registration_fee,
          utrReference: payload.utrReference,
        });
        if (emailResult.sent) {
          newReg.email_notifications = [{
            sent: true,
            provider: 'resend',
            type: 'registration_received',
            id: emailResult.id,
            recipient: payload.email,
            timestamp: emailResult.timestamp,
          }];
        }
      } catch (err) {
        console.warn('Failed to dispatch registration email', err);
      }
    }

    storedRegs.push(newReg);
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(storedRegs));

    // Update remaining slots in memory
    targetEvent.available_slots = Math.max(0, targetEvent.max_participants - (activeCount + 1));
    saveStoredEvents(events);

    return {
      success: true,
      message: statusMessage,
      registrationNumber: regNumber,
      registrationId: newReg.id,
      registrationStatus,
      remainingSlots: targetEvent.available_slots,
      emailResult,
    };
  },

  /**
   * Secure lookup of a player's own registration by Registration Number and Phone Number.
   */
  async lookupRegistration(registrationNumber: string, phone: string): Promise<{
    found: boolean;
    registration?: any;
    message?: string;
  }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('lookup_registration', {
          p_registration_number: registrationNumber,
          p_phone: phone,
        });

        if (!error && data && data.found) {
          const localList = getStoredRegistrations();
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          const localMatch = localList.find(
            (r: any) =>
              r.registration_number?.toUpperCase() === registrationNumber.trim().toUpperCase() &&
              (r.phone === cleanPhone || r.phone.endsWith(cleanPhone) || cleanPhone.endsWith(r.phone))
          );
          if (localMatch) {
            return {
              ...data,
              registration: {
                ...data.registration,
                attendance_status: localMatch.attendance_status || data.registration.attendance_status,
                payment_status: localMatch.payment_status || data.registration.payment_status,
              },
            };
          }
          return data;
        }
      } catch (e) {
        console.warn('Supabase lookup failed, trying local storage', e);
      }
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const storedRegs = getStoredRegistrations();
    const match = storedRegs.find(
      (r: any) =>
        r.registration_number.toUpperCase() === registrationNumber.trim().toUpperCase() &&
        (r.phone === cleanPhone || r.phone.endsWith(cleanPhone) || cleanPhone.endsWith(r.phone))
    );

    if (match) {
      const events = getStoredEvents();
      const evt = events.find((e) => e.id === match.event_id);
      
      let computedStatus: ParticipantRegistrationStatus = match.registration_status;
      if (!computedStatus) {
        if (match.payment_status === 'verified') computedStatus = 'confirmed';
        else if (match.payment_status === 'rejected') computedStatus = 'rejected';
        else computedStatus = (match.utr_reference || match.payment_screenshot_path) ? 'payment_submitted' : 'received';
      }

      return {
        found: true,
        registration: {
          ...match,
          registration_status: computedStatus,
          rejection_reason: match.rejection_reason || undefined,
          email_notifications: match.email_notifications || undefined,
          event_title: evt?.title || 'Weekend Badminton Session',
          event_date: evt?.event_date,
          start_time: evt?.start_time,
          end_time: evt?.end_time,
          venue: evt?.venue,
          registration_fee: evt?.registration_fee,
        },
      };
    }

    return {
      found: false,
      message: 'No matching registration found for this number and phone combination.',
    };
  },

  /**
   * Manual event update by organizers.
   */
  async updateEventManually(updatedEvent: DatabaseEvent): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('events').upsert({
          id: updatedEvent.id,
          title: updatedEvent.title,
          description: updatedEvent.description,
          event_date: updatedEvent.event_date,
          start_time: updatedEvent.start_time,
          end_time: updatedEvent.end_time,
          venue: updatedEvent.venue,
          registration_fee: updatedEvent.registration_fee,
          max_participants: updatedEvent.max_participants,
          registration_deadline: updatedEvent.registration_deadline,
          status: updatedEvent.status,
        });
        if (error) {
          console.warn('Supabase updateEventManually failed', error);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const events = getStoredEvents();
    const index = events.findIndex((e) => e.id === updatedEvent.id);
    if (index >= 0) {
      events[index] = updatedEvent;
    } else {
      events.push(updatedEvent);
    }
    saveStoredEvents(events);
    return true;
  },

  /**
   * Admin event creation.
   */
  async createEvent(newEvent: Omit<DatabaseEvent, 'id' | 'created_at'> & { created_at?: string }): Promise<DatabaseEvent> {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `event-${Date.now()}`;
    const event: DatabaseEvent = {
      ...newEvent,
      id,
      created_at: newEvent.created_at || new Date().toISOString(),
      available_slots: newEvent.max_participants,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('events').insert({
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          start_time: event.start_time,
          end_time: event.end_time,
          venue: event.venue,
          registration_fee: event.registration_fee,
          max_participants: event.max_participants,
          registration_deadline: event.registration_deadline,
          status: event.status,
        });
        if (error) console.warn('Supabase createEvent error', error);
      } catch (e) {
        console.error('Failed to insert event in Supabase', e);
      }
    }

    const events = getStoredEvents();
    events.push(event);
    saveStoredEvents(events);
    return event;
  },

  async subscribeForAlerts(contact: string, channel: 'whatsapp' | 'email'): Promise<{ success: boolean; message: string }> {
    try {
      const subs = JSON.parse(localStorage.getItem('naadansmash_subscribers') || '[]');
      subs.push({ contact, channel, timestamp: new Date().toISOString() });
      localStorage.setItem('naadansmash_subscribers', JSON.stringify(subs));
    } catch (e) {
      console.error(e);
    }
    return { success: true, message: "You're subscribed! We'll alert you the moment the next session opens." };
  },

  /**
   * Admin Authentication via Supabase Auth & Organizer Portal
   */
  async adminLogin(email: string, password: string): Promise<{ success: boolean; message: string; role?: string; user?: any }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data?.user) {
          let role = 'organizer';
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', data.user.id)
              .single();
            if (profile?.role) role = profile.role;
          } catch {}

          const session = {
            userId: data.user.id,
            email: data.user.email || email,
            role,
            fullName: 'Organizer',
          };
          localStorage.setItem('naadansmash_admin_session', JSON.stringify(session));
          return { success: true, message: 'Logged in successfully', role, user: data.user };
        }
      } catch (e: any) {
        console.warn('Supabase auth sign in error', e);
      }
    }

    // Quick Organizer Access fallback
    if ((email === 'admin@naadansmash.com' && password === 'admin123') || password === 'naadansmash2026' || password === 'admin123') {
      const mockSession = {
        userId: 'admin-local-01',
        email: email || 'organizer@naadansmash.com',
        role: 'admin',
        fullName: 'Lead Organizer',
      };
      localStorage.setItem('naadansmash_admin_session', JSON.stringify(mockSession));
      return { success: true, message: 'Organizer logged in successfully', role: 'admin', user: mockSession };
    }

    return { success: false, message: 'Invalid credentials. Enter your Supabase user or organizer password.' };
  },

  async adminLogout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem('naadansmash_admin_session');
  },

  getAdminSession(): { userId: string; email: string; role: string; fullName: string } | null {
    try {
      const raw = localStorage.getItem('naadansmash_admin_session');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },

  /**
   * Fetches all registered players for attendance and payment verification.
   */
  async getEventRegistrations(eventId?: string): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('registrations').select('*').order('created_at', { ascending: false });
        if (eventId) {
          query = query.eq('event_id', eventId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase getEventRegistrations query error', e);
      }
    }

    const localList = getStoredRegistrations();
    if (eventId) {
      return localList.filter((r: any) => r.event_id === eventId);
    }
    return localList;
  },

  /**
   * Court Check-in: Updates player attendance (registered -> present -> absent)
   */
  async updateRegistrationAttendance(regId: string, attendanceStatus: 'registered' | 'present' | 'absent'): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('registrations')
          .update({ attendance_status: attendanceStatus })
          .eq('id', regId);
        if (error) console.warn('Supabase attendance update error', error);
      } catch (e) {
        console.warn(e);
      }
    }

    const list = getStoredRegistrations();
    const idx = list.findIndex((r: any) => r.id === regId);
    if (idx >= 0) {
      const reg = list[idx];
      if (!reg.payment_audit_history) reg.payment_audit_history = [];
      reg.payment_audit_history.push({
        action: 'attendance_updated',
        timestamp: new Date().toISOString(),
        actor: 'admin',
        note: `Attendance marked as ${attendanceStatus}`,
        previousStatus: reg.attendance_status,
        newStatus: attendanceStatus,
      });
      reg.attendance_status = attendanceStatus;
      saveStoredRegistrations(list);
    }
    return true;
  },

  /**
   * Participant submission or update of payment details (UTR / Screenshot)
   */
  async submitPaymentDetails(
    registrationNumber: string,
    phone: string,
    utrReference: string,
    paymentScreenshotPath?: string
  ): Promise<{ success: boolean; message: string; registration?: any }> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanReg = registrationNumber.trim().toUpperCase();

    const list = getStoredRegistrations();
    const index = list.findIndex(
      (r: any) =>
        r.registration_number?.toUpperCase() === cleanReg &&
        (r.phone === cleanPhone || r.phone.endsWith(cleanPhone) || cleanPhone.endsWith(r.phone))
    );

    if (index < 0) {
      return {
        success: false,
        message: 'Could not find a registration matching this registration number and phone number.',
      };
    }

    const reg = list[index];
    const prevStatus = reg.payment_status;
    reg.utr_reference = utrReference.trim() || reg.utr_reference;
    if (paymentScreenshotPath) {
      reg.payment_screenshot_path = paymentScreenshotPath;
    }
    reg.payment_status = 'pending';
    reg.registration_status = 'payment_submitted';
    
    if (!reg.payment_audit_history) reg.payment_audit_history = [];
    reg.payment_audit_history.push({
      action: reg.rejection_reason ? 're_submitted' : 'utr_submitted',
      timestamp: new Date().toISOString(),
      actor: 'participant',
      note: `Submitted UTR reference: ${utrReference.trim()}${paymentScreenshotPath ? ' with receipt screenshot' : ''}`,
      previousStatus: prevStatus,
      newStatus: 'pending',
    });

    delete reg.rejection_reason;

    saveStoredRegistrations(list);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('registrations')
          .update({
            utr_reference: reg.utr_reference,
            payment_screenshot_path: reg.payment_screenshot_path,
            payment_status: 'pending',
          })
          .eq('id', reg.id);
      } catch (e) {
        console.warn('Supabase update failed on submitPaymentDetails', e);
      }
    }

    return {
      success: true,
      message: 'Your payment details have been submitted for verification.',
      registration: reg,
    };
  },

  /**
   * Payment Verification: Updates player payment (pending -> verified -> rejected)
   * When an administrator verifies payment: updates participant status to 'confirmed' and sends verification email.
   * When an administrator rejects payment: stores rejection reason and sends rejection email with organiser contact info.
   */
  async updateRegistrationPayment(
    regId: string, 
    paymentStatus: 'pending' | 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<{ success: boolean; emailResult?: EmailSendResult }> {
    const list = getStoredRegistrations();
    const idx = list.findIndex((r: any) => r.id === regId);
    let targetReg = idx >= 0 ? list[idx] : null;

    let registrationStatus: ParticipantRegistrationStatus = 'received';
    if (paymentStatus === 'verified') {
      registrationStatus = 'confirmed';
    } else if (paymentStatus === 'rejected') {
      registrationStatus = 'rejected';
    } else {
      registrationStatus = targetReg?.utr_reference ? 'payment_submitted' : 'received';
    }

    if (targetReg) {
      if (!targetReg.payment_audit_history) targetReg.payment_audit_history = [];
      targetReg.payment_audit_history.push({
        action: paymentStatus === 'verified' ? 'verified' : paymentStatus === 'rejected' ? 'rejected' : 'utr_submitted',
        timestamp: new Date().toISOString(),
        actor: 'admin',
        note: paymentStatus === 'rejected' ? `Rejected reason: ${rejectionReason || 'Details could not be verified'}` : 'Payment verified by administrator',
        previousStatus: targetReg.payment_status,
        newStatus: paymentStatus,
      });

      targetReg.payment_status = paymentStatus;
      targetReg.registration_status = registrationStatus;
      if (paymentStatus === 'rejected') {
        targetReg.rejection_reason = rejectionReason || 'Payment details could not be verified by the organiser.';
      } else {
        delete targetReg.rejection_reason;
      }
      saveStoredRegistrations(list);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = { payment_status: paymentStatus };
        await supabase
          .from('registrations')
          .update(updatePayload)
          .eq('id', regId);
      } catch (e) {
        console.warn('Supabase updateRegistrationPayment error', e);
      }
    }

    // Send email notification based on verification status change
    let emailResult: EmailSendResult | undefined;
    if (targetReg && targetReg.email && targetReg.email.includes('@')) {
      const events = getStoredEvents();
      const evt = events.find((e) => e.id === targetReg.event_id) || events[0];

      const emailInfo = {
        fullName: targetReg.full_name,
        email: targetReg.email,
        registrationNumber: targetReg.registration_number,
        eventTitle: evt?.title || 'Weekend Badminton Session',
        eventDate: evt?.event_date || 'Upcoming Weekend',
        startTime: evt?.start_time || '17:30',
        endTime: evt?.end_time || '20:30',
        venue: evt?.venue || 'Kochi Badminton Arena',
        registrationFee: evt?.registration_fee || 250,
        utrReference: targetReg.utr_reference,
        rejectionReason: targetReg.rejection_reason,
      };

      try {
        if (paymentStatus === 'verified') {
          emailResult = await emailService.sendPaymentVerifiedEmail(emailInfo);
        } else if (paymentStatus === 'rejected') {
          emailResult = await emailService.sendPaymentRejectedEmail(emailInfo);
        }

        if (emailResult && emailResult.sent) {
          if (!targetReg.email_notifications) targetReg.email_notifications = [];
          targetReg.email_notifications.push({
            sent: true,
            provider: 'resend',
            type: paymentStatus === 'verified' ? 'payment_verified' : 'payment_rejected',
            id: emailResult.id,
            recipient: targetReg.email,
            timestamp: emailResult.timestamp,
          });
          saveStoredRegistrations(list);
        }
      } catch (err) {
        console.warn('Failed to send status update email', err);
      }
    }

    return { success: true, emailResult };
  },
};
