import axios from 'axios';
import { URL } from 'url';

const GOOGLEBOT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

const CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// In-memory cache for parsed robots.txt rules by origin
const robotsCache = new Map();

/**
 * Fetches and caches robots.txt content by domain origin.
 */
async function fetchRobotsTxt(origin) {
  if (robotsCache.has(origin)) {
    return robotsCache.get(origin);
  }
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await axios.get(robotsUrl, {
      headers: { 'User-Agent': GOOGLEBOT_HEADERS['User-Agent'] },
      timeout: 3000,
    });
    const text = response.data || '';
    robotsCache.set(origin, text);
    return text;
  } catch {
    robotsCache.set(origin, ''); // Cache empty string on failure to avoid looping network calls
    return '';
  }
}

/**
 * Parses cached robots.txt and verifies if crawling path is allowed.
 */
async function isCrawlAllowed(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const robotsTxt = await fetchRobotsTxt(parsed.origin);
    if (!robotsTxt) return true; // Allowed by default if sitemap/robots doesn't exist

    const lines = robotsTxt.split(/\r?\n/);
    let matchedUserAgent = false;
    const disallowRules = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      if (key === 'user-agent') {
        matchedUserAgent = (value === '*' || value.toLowerCase() === 'googlebot');
      } else if (matchedUserAgent && key === 'disallow') {
        if (value) disallowRules.push(value);
      }
    }

    const pathToCheck = parsed.pathname + parsed.search;
    for (const rule of disallowRules) {
      // Escape regex special chars except * which acts as a wildcard
      const ruleRegex = rule
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      const regex = new RegExp('^' + ruleRegex);
      if (regex.test(pathToCheck) || pathToCheck.startsWith(rule)) {
        return false;
      }
    }
    return true;
  } catch {
    return true; // Default allowed if parsing fails
  }
}

/**
 * Fetches HTML contents from page with strict validation, response metadata, size caps, and retry.
 * 
 * @param {string} targetUrl - Target URL to fetch.
 * @param {number} [retries=1] - Number of retries on failure.
 * @param {boolean} [useChrome=false] - Whether to use Chrome browser headers.
 * @returns {Promise<object>} Structured response object.
 */
export async function fetchPageHtml(targetUrl, retries = 1, useChrome = false) {
  const startTime = Date.now();
  console.log(`[DEBUG STAGE 1: Incoming URL] URL: ${targetUrl} | Agent: ${useChrome ? 'Chrome' : 'Googlebot'}`);

  // 1. URL Validation
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    const errorMsg = `Invalid URL structure: ${targetUrl}`;
    console.error(`[Crawler Service] URL validation error: ${errorMsg}`);
    return {
      success: false,
      originalUrl: targetUrl,
      finalUrl: '',
      statusCode: 0,
      responseTime: Date.now() - startTime,
      contentType: '',
      html: '',
      error: errorMsg
    };
  }

  // 2. robots.txt checking
  const allowed = await isCrawlAllowed(targetUrl);
  console.log(`[DEBUG STAGE 2: robots.txt status] URL: ${targetUrl} | Allowed: ${allowed}`);
  if (!allowed) {
    const warningMsg = `Crawling disallowed by robots.txt rules for: ${targetUrl}`;
    console.warn(`[Crawler Service] Crawl blocker: ${warningMsg}`);
    return {
      success: false,
      originalUrl: targetUrl,
      finalUrl: '',
      statusCode: 403,
      responseTime: Date.now() - startTime,
      contentType: '',
      html: '',
      error: warningMsg
    };
  }

  try {
    // 3. Axios fetch with size limit and compression configurations
    const headers = useChrome ? CHROME_HEADERS : GOOGLEBOT_HEADERS;
    const response = await axios.get(targetUrl, {
      headers,
      timeout: 8000,
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024, // Reject files > 5MB
      maxBodyLength: 5 * 1024 * 1024,
      decompress: true, // Auto handle gzip/deflate/br
      responseEncoding: 'utf8',
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const finalUrl = response.request.res.responseUrl || targetUrl;
    const contentType = response.headers['content-type'] || '';
    const statusCode = response.status;
    const responseTime = Date.now() - startTime;

    // 4. Content-Type Check (Only HTML accepted)
    const isHtml = contentType.toLowerCase().includes('text/html') || 
                   contentType.toLowerCase().includes('application/xhtml+xml') ||
                   contentType.toLowerCase().includes('text/xml') ||
                   contentType.toLowerCase().includes('application/xml');

    if (!isHtml) {
      const errorMsg = `Rejected non-HTML response (Content-Type: ${contentType})`;
      console.warn(`[Crawler Service] Warning: ${errorMsg} for ${targetUrl}`);
      return {
        success: false,
        originalUrl: targetUrl,
        finalUrl,
        statusCode,
        responseTime,
        contentType,
        html: '',
        error: errorMsg
      };
    }

    const htmlContent = response.data || '';
    console.log(`[DEBUG STAGE 5: HTML length fetched] URL: ${targetUrl} | Length: ${htmlContent.length} characters`);
    
    // Check if the html page is a known WAF or security block page
    const lowText = htmlContent.toLowerCase();
    const isBlocked = lowText.includes('request has been blocked') ||
                      lowText.includes('access denied') ||
                      lowText.includes('security verification') ||
                      lowText.includes('ddos protection') ||
                      lowText.includes('enable cookies') ||
                      lowText.includes('captcha-delivery') ||
                      lowText.includes('cloudflare ray id') ||
                      lowText.includes('attention required! | cloudflare') ||
                      (statusCode === 403 && lowText.includes('cloudflare'));

    if (isBlocked) {
      const blockMsg = 'Access Denied: Scraping request blocked by security firewall (WAF/Cloudflare).';
      console.warn(`[Crawler Service] Blocked signature match for ${targetUrl}`);
      
      // Auto-retry with alternate User-Agent if blocked
      if (retries > 0) {
        console.log(`[Crawler Service] Swapping browser agents on block detection for ${targetUrl}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchPageHtml(targetUrl, retries - 1, !useChrome);
      }

      return {
        success: false,
        originalUrl: targetUrl,
        finalUrl,
        statusCode: 403,
        responseTime: Date.now() - startTime,
        contentType,
        html: '',
        error: blockMsg
      };
    }

    return {
      success: true,
      originalUrl: targetUrl,
      finalUrl,
      statusCode,
      responseTime,
      contentType,
      html: htmlContent,
      error: null
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // 5. Retry Mechanism with Alternate Agent Swap
    if (retries > 0) {
      console.log(`[Crawler Service] Retrying request for ${targetUrl} due to: ${error.message} (attempts remaining: ${retries}). Swapping Agent...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchPageHtml(targetUrl, retries - 1, !useChrome);
    }

    const finalUrl = error.response?.request?.res?.responseUrl || '';
    const statusCode = error.response?.status || 500;
    const contentType = error.response?.headers?.['content-type'] || '';

    console.error(`[Crawler Service] Failure fetching ${targetUrl} - Error: ${error.message}`);
    return {
      success: false,
      originalUrl: targetUrl,
      finalUrl,
      statusCode,
      responseTime,
      contentType,
      html: '',
      error: error.message
    };
  }
}
