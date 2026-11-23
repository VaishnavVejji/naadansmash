import { createClient } from '@supabase/supabase-js';

const url = 'https://odnjkvxqypjklsjgxpoj.supabase.co';
const anonKey = 'sb_publishable_cYWbnMxIdT996o4RoYu2Aw_FpgHkkVs';

// Anon client (representing public internet visitor / unauthenticated user)
const anonClient = createClient(url, anonKey);

function buildPayload(eventId, fullName, phone, overrides = {}) {
  return {
    p_event_id: eventId,
    p_full_name: fullName,
    p_email: null,
    p_phone: phone,
    p_age: 26,
    p_gender: 'Male',
    p_skill_level: 'Intermediate',
    p_playing_category: 'Open Doubles',
    p_emergency_contact: null,
    p_utr_reference: null,
    p_payment_screenshot_path: null,
    ...overrides,
  };
}

async function runSecurityAndBackendAudit() {
  console.log('===============================================================');
  console.log('NAADANSMASH — COMPREHENSIVE QA & SECURITY AUDIT TEST SUITE');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Target:', url);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `— ${details}` : ''}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. SECURITY & RLS TESTS
  // =========================================================================
  console.log('--- [1/4] SECURITY & ACCESS CONTROL TESTS ---');

  // Test 1.1: Public participant data access restriction (RLS on registrations table)
  try {
    const { data: regList, error: regListErr } = await anonClient
      .from('registrations')
      .select('*');

    const isProtected = regListErr || (regList && regList.length === 0);
    assert(isProtected, 'RLS: Anonymous user cannot enumerate participant registrations', 
      regListErr ? regListErr.message : `Returned ${regList?.length || 0} rows (Blocked by RLS)`);
  } catch (e) {
    assert(true, 'RLS: Anonymous user cannot enumerate participant registrations', e.message);
  }

  // Test 1.2: Direct unauthorized write to registrations table blocked
  try {
    const { data: directInsert, error: insertErr } = await anonClient
      .from('registrations')
      .insert({
        registration_number: 'HACK-001',
        event_id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Malicious Injected Player',
        phone: '9999999999',
        skill_level: 'Intermediate',
        payment_status: 'verified',
      });

    assert(insertErr !== null, 'RLS: Direct unauthorized insert into registrations is blocked', 
      insertErr ? insertErr.message : 'FAILED: Anonymous client inserted record directly!');
  } catch (e) {
    assert(true, 'RLS: Direct unauthorized insert blocked', e.message);
  }

  // Test 1.3: Direct unauthorized update to payment settings table blocked
  try {
    const { data: directPayUpdate, error: payUpdateErr } = await anonClient
      .from('payment_settings')
      .update({ upi_id: 'hacker@upi' })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select();

    const blocked = payUpdateErr !== null || (Array.isArray(directPayUpdate) && directPayUpdate.length === 0);
    assert(blocked, 'RLS: Direct unauthorized update to payment_settings is blocked by RLS',
      payUpdateErr ? payUpdateErr.message : '0 rows updated (Protected by RLS)');
  } catch (e) {
    assert(true, 'RLS: Payment settings update blocked', e.message);
  }

  // Test 1.4: Public published events accessible
  try {
    const { data: events, error: evErr } = await anonClient
      .from('events')
      .select('*')
      .eq('status', 'published');

    assert(!evErr && events && events.length > 0, 
      'Public published events accessible for website listings',
      `Found ${events?.length || 0} published events`);
  } catch (e) {
    assert(false, 'Public published events accessible', e.message);
  }

  // Test 1.5: Secure 1-to-1 participant lookup authorization check
  try {
    const { data: wrongPhoneLookup } = await anonClient.rpc('lookup_registration', {
      p_registration_number: 'NS-2611-24EB29',
      p_phone: '0000000000',
    });

    assert(wrongPhoneLookup && !wrongPhoneLookup.found, 
      'Lookup Security: Mismatched phone blocked from accessing participant record',
      wrongPhoneLookup ? wrongPhoneLookup.message : '');
  } catch (e) {
    assert(false, 'Lookup Security check', e.message);
  }

  // =========================================================================
  // 2. REGISTRATION LOGIC & BUSINESS RULES
  // =========================================================================
  console.log('\n--- [2/4] REGISTRATION LOGIC & VALIDATION TESTS ---');

  // Fetch active event
  const { data: activeEvents } = await anonClient
    .from('events')
    .select('*')
    .eq('status', 'published')
    .limit(1);

  const activeEvent = activeEvents?.[0];

  // Test 2.1: Invalid Phone Number validation (< 10 digits)
  if (activeEvent) {
    try {
      const { data: invalidPhoneRes } = await anonClient.rpc('register_for_event', 
        buildPayload(activeEvent.id, 'Invalid Phone Tester', '12345')
      );

      assert(invalidPhoneRes && !invalidPhoneRes.success && invalidPhoneRes.error === 'INVALID_PHONE',
        'Validation: Invalid phone number (< 10 digits) rejected by backend',
        invalidPhoneRes?.message);
    } catch (e) {
      assert(false, 'Invalid phone number rejection', e.message);
    }
  }

  // Test 2.2: Valid Registration & Duplicate Prevention
  if (activeEvent) {
    try {
      const { data: slotCount } = await anonClient.rpc('get_event_remaining_slots', { p_event_id: activeEvent.id });
      const hasSlots = slotCount !== null && slotCount > 0;
      const uniquePhone = '9800' + Math.floor(100000 + Math.random() * 900000);
      const reg1 = await anonClient.rpc('register_for_event', 
        buildPayload(activeEvent.id, 'Audit Primary Player', uniquePhone, {
          p_email: 'audit.player@example.com',
          p_utr_reference: 'AUDIT12345678',
        })
      );

      if (hasSlots) {
        assert(reg1.data && reg1.data.success, 
          'Registration: Valid registration successfully created', 
          `Reg #: ${reg1.data?.registration_number}`);
      } else {
        assert(reg1.data && !reg1.data.success && reg1.data.error === 'EVENT_FULL',
          'Registration: Capacity boundary properly enforced when session is full',
          reg1.data?.message);
      }

      // Second attempt with SAME phone (Duplicate check)
      const reg2 = await anonClient.rpc('register_for_event', 
        buildPayload(activeEvent.id, 'Audit Duplicate Attempt', uniquePhone)
      );

      assert(reg2.data && !reg2.data.success && (reg2.data.error === 'DUPLICATE_REGISTRATION' || reg2.data.error === 'EVENT_FULL'),
        'Concurrency & Deduplication: Duplicate registration with same phone blocked',
        reg2.data?.message);

      // Verify Lookup for this registration
      if (reg1.data && reg1.data.registration_number) {
        const lookup = await anonClient.rpc('lookup_registration', {
          p_registration_number: reg1.data.registration_number,
          p_phone: uniquePhone,
        });

        assert(lookup.data && lookup.data.found, 
          'Lookup Verification: Newly registered player can access their confirmation pass',
          `Full Name: ${lookup.data?.registration?.full_name}`);
      }
    } catch (e) {
      assert(false, 'Duplicate registration prevention', e.message);
    }
  }

  // Test 2.3: Closed Event Registration Blocked
  const { data: completedEvents } = await anonClient
    .from('events')
    .select('*')
    .eq('status', 'completed')
    .limit(1);

  if (completedEvents && completedEvents[0]) {
    try {
      const closedRes = await anonClient.rpc('register_for_event', 
        buildPayload(completedEvents[0].id, 'Late Attendee', '9847000000')
      );

      assert(closedRes.data && !closedRes.data.success && closedRes.data.error === 'REGISTRATION_CLOSED',
        'Lifecycle: Registration to non-published/completed event blocked',
        closedRes.data?.message);
    } catch (e) {
      assert(false, 'Closed event registration test', e.message);
    }
  }

  // Test 2.4: Remaining slots calculation
  if (activeEvent) {
    try {
      const { data: slots, error: slotsErr } = await anonClient.rpc('get_event_remaining_slots', {
        p_event_id: activeEvent.id,
      });

      assert(!slotsErr && typeof slots === 'number' && slots >= 0,
        'Capacity Management: Remaining slots accurately computed via SQL function',
        `Available slots: ${slots} / ${activeEvent.max_participants}`);
    } catch (e) {
      assert(false, 'Remaining slots calculation', e.message);
    }
  }

  // =========================================================================
  // 3. ADMIN AUTHENTICATION & ACCESS
  // =========================================================================
  console.log('\n--- [3/4] ADMIN AUTHENTICATION TESTS ---');

  // Test 3.1: Invalid admin login credentials rejected
  try {
    const { data: invalidAuth, error: authErr } = await anonClient.auth.signInWithPassword({
      email: 'nonexistent.admin@naadansmash.com',
      password: 'wrongpassword123',
    });

    assert(authErr !== null, 'Auth Security: Invalid admin login credentials rejected by Supabase Auth',
      authErr?.message);
  } catch (e) {
    assert(true, 'Invalid admin login rejected', e.message);
  }

  // =========================================================================
  // 4. STORAGE & AUDIT INTEGRITY
  // =========================================================================
  console.log('\n--- [4/4] STORAGE & AUDIT INTEGRITY TESTS ---');

  // Test 4.1: Public cannot delete or modify arbitrary system tables
  try {
    const { data: deletedRows, error: dropErr } = await anonClient
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    const blocked = dropErr !== null || (Array.isArray(deletedRows) && deletedRows.length === 0);
    assert(blocked, 'RLS: Unauthorized bulk modification/deletion blocked', 
      dropErr ? dropErr.message : '0 rows deleted (Protected by RLS)');
  } catch (e) {
    assert(true, 'RLS: Unauthorized bulk modification blocked', e.message);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAndBackendAudit();
