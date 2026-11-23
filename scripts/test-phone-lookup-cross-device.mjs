async function testAllPhones() {
  const dynamicPhone = '888' + Math.floor(1000000 + Math.random() * 9000000);
  const dynamicReg = 'NS-888';
  console.log('1. Registering dynamic ticket for phone:', dynamicPhone);
  
  const postRes = await fetch('https://naadansmash.netlify.app/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: dynamicPhone,
      regNumber: dynamicReg,
      registration: {
        registration_number: dynamicReg,
        phone: dynamicPhone,
        full_name: 'Cross Device Real Mobile User',
        skill_level: 'Intermediate',
        payment_status: 'verified',
        attendance_status: 'registered',
        event_title: 'Sunday Match Session',
        venue: 'Cochin Sports Arena, Edappally, Kochi'
      }
    })
  });
  console.log('Registration POST status:', postRes.status);

  const testCases = [
    { p: dynamicPhone, expected: dynamicReg },
    { p: '+91' + dynamicPhone, expected: dynamicReg },
    { p: '+91 ' + dynamicPhone.slice(0, 5) + ' ' + dynamicPhone.slice(5), expected: dynamicReg },
    { p: '9876543210', expected: 'NS-007' },
    { p: '+91 98765 43210', expected: 'NS-007' }
  ];

  let passed = 0;
  for (const item of testCases) {
    const digitsOnly = item.p.replace(/\D/g, '');
    const cleanPhone = digitsOnly.slice(-10);
    const res = await fetch('https://naadansmash.netlify.app/api/tickets?q=' + encodeURIComponent(cleanPhone));
    const data = await res.json();
    const hasTicket = data.found && data.tickets && data.tickets.some(t => t.registration_number === item.expected);
    if (hasTicket) {
      console.log(`✅ PASS: Phone [${item.p}] retrieved ticket [${item.expected}]`);
      passed++;
    } else {
      console.error(`❌ FAIL: Phone [${item.p}] did NOT retrieve ticket [${item.expected}]`);
    }
  }

  console.log(`\nResult: ${passed}/${testCases.length} tests passed.`);
  if (passed === testCases.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testAllPhones();
