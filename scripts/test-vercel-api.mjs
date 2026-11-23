import handlerTickets from '../api/tickets.ts';
import handlerAdminAuth from '../api/admin-auth.ts';

async function testVercelHandlers() {
  console.log('Testing Vercel Edge Serverless Function Handlers...');

  // 1. Test Admin Auth GET
  const reqAdminGet = new Request('https://naadansmash.vercel.app/api/admin-auth', { method: 'GET' });
  const resAdminGet = await handlerAdminAuth(reqAdminGet);
  const dataAdminGet = await resAdminGet.json();
  console.log('Admin Auth GET result:', dataAdminGet);
  if (!dataAdminGet.success || !dataAdminGet.phone) throw new Error('Admin Auth GET failed');

  // 2. Test Admin Auth POST (Login)
  const reqAdminPost = new Request('https://naadansmash.vercel.app/api/admin-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '8304883872', password: 'naadansmash2026' }),
  });
  const resAdminPost = await handlerAdminAuth(reqAdminPost);
  const dataAdminPost = await resAdminPost.json();
  console.log('Admin Auth POST status:', resAdminPost.status, 'Session created:', !!dataAdminPost.session);
  if (!dataAdminPost.success) throw new Error('Admin Auth POST failed');

  // 3. Test Tickets GET all
  const reqTicketsAll = new Request('https://naadansmash.vercel.app/api/tickets', { method: 'GET' });
  const resTicketsAll = await handlerTickets(reqTicketsAll);
  const dataTicketsAll = await resTicketsAll.json();
  console.log('Tickets GET all count:', dataTicketsAll.count);
  if (!dataTicketsAll.success || dataTicketsAll.count === 0) throw new Error('Tickets GET all failed');

  // 4. Test Tickets GET by Phone
  const reqTicketsPhone = new Request('https://naadansmash.vercel.app/api/tickets?q=9876543210', { method: 'GET' });
  const resTicketsPhone = await handlerTickets(reqTicketsPhone);
  const dataTicketsPhone = await resTicketsPhone.json();
  console.log('Tickets GET by phone status:', dataTicketsPhone.found, 'Ticket:', dataTicketsPhone.registration?.registration_number);
  if (!dataTicketsPhone.found || dataTicketsPhone.registration?.registration_number !== 'NS-007') {
    throw new Error('Tickets GET by phone failed');
  }

  // 5. Test Tickets POST new ticket
  const randomPhone = '999' + Math.floor(1000000 + Math.random() * 9000000);
  const reqTicketsPost = new Request('https://naadansmash.vercel.app/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: randomPhone,
      regNumber: 'NS-999',
      registration: {
        full_name: 'Vercel Test User',
        phone: randomPhone,
        registration_number: 'NS-999',
        event_title: 'Sunday Match Session',
      },
    }),
  });
  const resTicketsPost = await handlerTickets(reqTicketsPost);
  const dataTicketsPost = await resTicketsPost.json();
  console.log('Tickets POST status:', resTicketsPost.status, 'Saved:', dataTicketsPost.success);
  if (!dataTicketsPost.success) throw new Error('Tickets POST failed');

  console.log('\n🎉 ALL VERCEL API HANDLER TESTS PASSED 100%!');
}

testVercelHandlers().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
