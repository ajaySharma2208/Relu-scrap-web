import axios from 'axios';
import https from 'https';

async function testFetch() {
  const targetUrl = 'https://openai.com';
  
  // Custom browser-like ciphers agent
  const agent = new https.Agent({
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256',
    honorCipherOrder: true,
    minVersion: 'TLSv1.2'
  });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  try {
    console.log('Fetching openai.com with standard Axios request...');
    const res1 = await axios.get(targetUrl, { headers, timeout: 5000 });
    console.log('Standard Success!', res1.status);
  } catch (err) {
    console.log('Standard Failed:', err.message);
  }

  try {
    console.log('\nFetching openai.com with custom TLS agent ciphers...');
    const res2 = await axios.get(targetUrl, { 
      headers, 
      httpsAgent: agent,
      timeout: 5000 
    });
    console.log('Custom TLS Agent Success!', res2.status, 'HTML length:', res2.data.length);
  } catch (err) {
    console.log('Custom TLS Agent Failed:', err.message);
  }
}

testFetch();
