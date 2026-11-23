import handlerEvents from '../api/events.ts';
import handlerPaymentSettings from '../api/payment-settings.ts';

async function runTests() {
  console.log('Testing Events & Payment Settings Cloud Sync Endpoints...');

  // 1. Test GET /api/events
  const reqEventsGet = new Request('https://naadansmash.vercel.app/api/events', { method: 'GET' });
  const resEventsGet = await handlerEvents(reqEventsGet);
  const dataEventsGet = await resEventsGet.json();
  console.log('GET /api/events count:', dataEventsGet.count, 'first title:', dataEventsGet.events?.[0]?.title);
  if (!dataEventsGet.success || dataEventsGet.count === 0) throw new Error('GET /api/events failed');

  // 2. Test PUT /api/events (Admin updating event title and fee)
  const updatedPayload = {
    id: dataEventsGet.events[0].id,
    title: 'Sunday Super Smash — Session #2 (Updated by Admin)',
    registration_fee: 300,
    status: 'published',
  };
  const reqEventsPut = new Request('https://naadansmash.vercel.app/api/events', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: updatedPayload }),
  });
  const resEventsPut = await handlerEvents(reqEventsPut);
  const dataEventsPut = await resEventsPut.json();
  console.log('PUT /api/events result:', dataEventsPut.success, 'New title:', dataEventsPut.event?.title);
  if (!dataEventsPut.success || dataEventsPut.event?.title !== updatedPayload.title) {
    throw new Error('PUT /api/events failed');
  }

  // 3. Test GET /api/events again to confirm persistence
  const resEventsVerify = await handlerEvents(reqEventsGet);
  const dataEventsVerify = await resEventsVerify.json();
  console.log('Verify GET /api/events title:', dataEventsVerify.events?.[0]?.title);
  if (dataEventsVerify.events?.[0]?.title !== updatedPayload.title) {
    throw new Error('Verify GET /api/events persistence failed');
  }

  // 4. Test GET /api/payment-settings
  const reqPayGet = new Request('https://naadansmash.vercel.app/api/payment-settings', { method: 'GET' });
  const resPayGet = await handlerPaymentSettings(reqPayGet);
  const dataPayGet = await resPayGet.json();
  console.log('GET /api/payment-settings upi_id:', dataPayGet.settings?.upi_id);
  if (!dataPayGet.success || !dataPayGet.settings?.upi_id) throw new Error('GET /api/payment-settings failed');

  // 5. Test PUT /api/payment-settings (Admin updating UPI ID)
  const reqPayPut = new Request('https://naadansmash.vercel.app/api/payment-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upi_id: 'psivaram17-1@oksbi', account_display_name: 'Sivaram P Babu (Verified)' }),
  });
  const resPayPut = await handlerPaymentSettings(reqPayPut);
  const dataPayPut = await resPayPut.json();
  console.log('PUT /api/payment-settings result:', dataPayPut.success, 'New UPI:', dataPayPut.settings?.upi_id);
  if (!dataPayPut.success || dataPayPut.settings?.account_display_name !== 'Sivaram P Babu (Verified)') {
    throw new Error('PUT /api/payment-settings failed');
  }

  console.log('\n🎉 ALL ADMIN EVENT & PAYMENT SETTINGS TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
