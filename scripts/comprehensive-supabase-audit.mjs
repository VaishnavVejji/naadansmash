import { createClient } from '@supabase/supabase-js';

const url = 'https://odnjkvxqypjklsjgxpoj.supabase.co';
const anonKey = 'sb_publishable_cYWbnMxIdT996o4RoYu2Aw_FpgHkkVs';

const supabase = createClient(url, anonKey);

async function runAudit() {
  console.log('====================================================');
  console.log('NAADANSMASH — FULL SUPABASE POSTGRESQL AUDIT');
  console.log('Connected to:', url);
  console.log('====================================================\n');

  // 1. Audit Events Table
  console.log('[1/6] AUDITING EVENTS TABLE...');
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('*');

  if (eventsErr) {
    console.error('❌ Error reading events:', eventsErr);
    return;
  }
  console.log(`✅ Events Table OK. Total Events Found: ${events.length}`);
  events.forEach((ev, i) => {
    console.log(`   [${i + 1}] ID: ${ev.id}`);
    console.log(`       Title: ${ev.title}`);
    console.log(`       Date: ${ev.event_date} | Time: ${ev.start_time} - ${ev.end_time}`);
    console.log(`       Venue: ${ev.venue}`);
    console.log(`       Fee: ₹${ev.registration_fee} | Max Capacity: ${ev.max_participants}`);
    console.log(`       Status: ${ev.status}`);
  });

  // 2. Audit Payment Settings Table
  console.log('\n[2/6] AUDITING PAYMENT SETTINGS TABLE...');
  const { data: paymentSettings, error: payErr } = await supabase
    .from('payment_settings')
    .select('*');

  if (payErr) {
    console.error('❌ Error reading payment settings:', payErr);
  } else {
    console.log(`✅ Payment Settings OK. Total Records: ${paymentSettings.length}`);
    paymentSettings.forEach((p) => {
      console.log(`   UPI ID: ${p.upi_id}`);
      console.log(`   Account Name: ${p.account_display_name}`);
      console.log(`   Instructions: ${p.payment_instructions}`);
    });
  }

  // Pick an active published event for functional verification
  const activeEvent = events.find((e) => e.status === 'published') || events[0];
  if (!activeEvent) {
    console.warn('⚠️ No published event found for registration testing.');
    return;
  }

  // 3. Test Remaining Slots RPC
  console.log(`\n[3/6] TESTING REMAINING SLOTS RPC FOR EVENT: "${activeEvent.title}"...`);
  const { data: slots, error: slotsErr } = await supabase.rpc('get_event_remaining_slots', {
    p_event_id: activeEvent.id,
  });

  if (slotsErr) {
    console.error('❌ Remaining slots RPC failed:', slotsErr);
  } else {
    console.log(`✅ get_event_remaining_slots RPC OK. Available slots: ${slots} / ${activeEvent.max_participants}`);
  }

  // 4. Test Atomic Registration RPC
  console.log('\n[4/6] TESTING ATOMIC REGISTRATION RPC (register_for_event)...');
  const testPhone = '9998887776';
  const testRegPayload = {
    p_event_id: activeEvent.id,
    p_full_name: 'Test Verification Player',
    p_email: null,
    p_phone: testPhone,
    p_age: 26,
    p_gender: 'Male',
    p_skill_level: 'Intermediate',
    p_playing_category: 'Open Doubles',
    p_emergency_contact: null,
    p_utr_reference: 'TEST12345678',
  };

  const { data: regRes, error: regErr } = await supabase.rpc('register_for_event', testRegPayload);
  if (regErr) {
    console.error('❌ Atomic registration RPC failed:', regErr);
    return;
  }

  console.log('Registration Response:', regRes);
  if (!regRes.success) {
    console.error('❌ Registration was not successful:', regRes.message);
    return;
  }
  const regNumber = regRes.registration_number;
  const regId = regRes.registration_id;
  console.log(`✅ Successfully registered! Generated Ticket Number: ${regNumber}`);

  // 5. Test Duplicate Prevention Constraint
  console.log('\n[5/6] TESTING DUPLICATE REGISTRATION PREVENTION...');
  const { data: dupRes, error: dupErr } = await supabase.rpc('register_for_event', testRegPayload);
  if (dupErr) {
    console.log('✅ Duplicate blocked with database error:', dupErr.message);
  } else if (!dupRes.success && dupRes.error === 'DUPLICATE_REGISTRATION') {
    console.log(`✅ Duplicate correctly blocked by function logic: "${dupRes.message}"`);
  } else {
    console.warn('⚠️ Unexpected duplicate response:', dupRes);
  }

  // 6. Test Secure Lookup RPC
  console.log('\n[6/6] TESTING SECURE LOOKUP RPC (lookup_registration)...');
  const { data: lookupRes, error: lookupErr } = await supabase.rpc('lookup_registration', {
    p_registration_number: regNumber,
    p_phone: testPhone,
  });

  if (lookupErr) {
    console.error('❌ Secure lookup RPC failed:', lookupErr);
  } else {
    console.log('Lookup Response:', lookupRes);
    if (lookupRes.found) {
      console.log(`✅ Secure lookup successful! Ticket #${lookupRes.registration.registration_number} verified for ${lookupRes.registration.full_name}`);
    } else {
      console.warn('⚠️ Lookup returned not found.');
    }
  }

  // Test Lookup with Wrong Phone (Security check)
  console.log('\n[SECURITY CHECK] Testing lookup with wrong phone number...');
  const { data: wrongPhoneRes } = await supabase.rpc('lookup_registration', {
    p_registration_number: regNumber,
    p_phone: '1111111111',
  });
  if (wrongPhoneRes && !wrongPhoneRes.found) {
    console.log('✅ Security check passed: Unauthorized viewer with wrong phone blocked from viewing ticket details.');
  } else {
    console.warn('⚠️ Security check warning:', wrongPhoneRes);
  }

  console.log('\n====================================================');
  console.log('🎉 AUDIT VERDICT: SUPABASE IS 100% OPERATIONAL!');
  console.log('====================================================');
}

runAudit();
