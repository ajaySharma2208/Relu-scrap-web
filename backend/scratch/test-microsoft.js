import axios from 'axios';

async function testFetch() {
  const url = 'https://www.microsoft.com';
  console.log(`Testing direct fetch to ${url}...`);
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Body Sample:\n${res.data.slice(0, 1000)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Response Status: ${err.response.status}`);
      console.log(`Response Body: ${JSON.stringify(err.response.data).slice(0, 500)}`);
    }
  }
}

testFetch();
