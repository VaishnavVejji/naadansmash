import { createClient } from '@supabase/supabase-js';

const url = 'https://odnjkvxqypjklsjgxpoj.supabase.co';
const anonKey = 'sb_publishable_cYWbnMxIdT996o4RoYu2Aw_FpgHkkVs';

console.log('--- SUPABASE LIVE BACKEND CONNECTIVITY TEST ---');
console.log('Connecting to:', url);
console.log('Project Ref:', 'odnjkvxqypjklsjgxpoj');

const supabase = createClient(url, anonKey);

async function runTests() {
  console.log('\n[TEST 1] Testing HTTP REST & Auth Handshake...');
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    console.log('REST Endpoint Status:', res.status);
    console.log('Server Header:', res.headers.get('server'));
    console.log('Project Ref Header:', res.headers.get('sb-project-ref'));
  } catch (err) {
    console.error('REST endpoint fetch failed:', err.message);
  }

  console.log('\n[TEST 2] Testing Database Tables via PostgREST Client...');
  const tables = ['events', 'registrations', 'profiles', 'payment_settings'];
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`- Table "${table}": Status ${status} | Code: ${error.code} | ${error.message}`);
      } else {
        console.log(`- Table "${table}": Status ${status} | Found ${data.length} records`);
      }
    } catch (err) {
      console.log(`- Table "${table}": Exception: ${err.message}`);
    }
  }

  console.log('\n[TEST 3] Testing Atomic Registration RPC (register_for_event)...');
  try {
    const { data, error, status } = await supabase.rpc('register_for_event', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_full_name: 'Test Runner',
      p_email: 'test@example.com',
      p_phone: '9876543210',
      p_age: 25,
      p_gender: 'Male',
      p_skill_level: 'Intermediate',
    });
    if (error) {
      console.log(`- RPC register_for_event: Status ${status} | Code: ${error.code} | ${error.message}`);
    } else {
      console.log(`- RPC register_for_event: Status ${status} | Result:`, data);
    }
  } catch (err) {
    console.log(`- RPC Exception: ${err.message}`);
  }

  console.log('\n--- TEST COMPLETE ---');
}

runTests();
