import axios from 'axios';

async function testFetch(label, headers) {
  try {
    const res = await axios.get('https://www.microsoft.com', { headers, timeout: 5000 });
    const isBlocked = res.data.includes('Your request has been blocked');
    console.log(`[${label}] Status: ${res.status} | Blocked: ${isBlocked} | Title: ${res.data.match(/<title>(.*?)<\/title>/)?.[1]}`);
  } catch (err) {
    console.log(`[${label}] Failed: ${err.message}`);
  }
}

async function run() {
  // Try 1: Googlebot user agent
  await testFetch('Googlebot UA', {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  });

  // Try 2: Minimal headers
  await testFetch('No headers', {});

  // Try 3: curl User-Agent
  await testFetch('curl UA', {
    'User-Agent': 'curl/7.64.1'
  });

  // Try 4: Custom Chrome Headers with specific Accept
  await testFetch('Chrome full headers', {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });
}

run();
