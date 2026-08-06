import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * Normalizes URL structure to ensure protocol is prepended and trailing slashes are removed.
 */
export function normalizeUrl(url) {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }
  try {
    const parsed = new URL(normalized);
    return parsed.origin + parsed.pathname.replace(/\/$/, '');
  } catch (error) {
    return normalized;
  }
}

/**
 * Extracts all unique internal links from homepage HTML.
 */
export function extractInternalLinks(homepageHtml, baseUrl) {
  const normalizedBase = normalizeUrl(baseUrl);
  const linksSet = new Set();
  
  try {
    const $ = cheerio.load(homepageHtml);
    const origin = new URL(normalizedBase).origin;

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, normalizedBase);
        if (absoluteUrl.origin === origin) {
          absoluteUrl.hash = ''; // Remove anchor links
          const cleanedLink = absoluteUrl.href.replace(/\/$/, '');
          linksSet.add(cleanedLink);
        }
      } catch {
        // Ignore invalid URL conversions
      }
    });
  } catch (error) {
    console.error(`[Page Selector] Fail during page link discovery:`, error.message);
  }

  return Array.from(linksSet);
}

/**
 * Computes a relevance score based on keyword paths.
 */
export function scoreUrl(url, baseUrl) {
  const normalizedBase = normalizeUrl(baseUrl);
  const lowerUrl = url.toLowerCase();
  
  // Ignore list (returns -100)
  const ignoreKeywords = [
    'blog', 'career', 'careers', 'cookies', 'cookie', 
    'news', 'events', 'faq', 'login', 'signup', 'cart', 'register',
    'wp-content', 'wp-includes', 'tag', 'category', 'checkout', 'my-account',
    'rss', 'feed', 'xml', 'pdf', 'jpg', 'png', 'gif'
  ];

  if (ignoreKeywords.some(kw => lowerUrl.includes(kw))) {
    return -100;
  }

  // Critical contact extraction keywords (+30)
  const contactKeywords = [
    'contact', 'contact-us', 'support', 'help', 'office', 'offices', 
    'location', 'locations', 'global-locations', 'headquarters', 
    'company', 'about', 'about-us', 'legal', 'privacy', 'imprint'
  ];

  // Secondary relevant keywords (+10)
  const secondaryKeywords = [
    'services', 'solutions', 'products', 'platform', 'technology', 
    'business', 'enterprise', 'industries', 'who-we-are', 'what-we-do', 
    'mission', 'vision'
  ];

  let score = 0;

  for (const kw of contactKeywords) {
    if (lowerUrl.includes(kw)) {
      score += 30;
    }
  }

  for (const kw of secondaryKeywords) {
    if (lowerUrl.includes(kw)) {
      score += 10;
    }
  }

  // Always highly score the homepage
  if (normalizeUrl(url) === normalizedBase) {
    score += 100;
  }

  return score;
}

/**
 * Filter, score, and select only the Top 5 unique pages.
 */
export function getTopRelevantPages(links, baseUrl, limit = 5) {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Prepend homepage to ensure it's in the candidate pool
  if (!links.includes(normalizedBase)) {
    links.unshift(normalizedBase);
  }

  // Deduplicate links
  const uniqueLinks = Array.from(new Set(links));

  const scored = uniqueLinks.map(link => ({
    link,
    score: scoreUrl(link, normalizedBase)
  }));

  // Filter out any pages with negative scores, sort descending by score
  const selected = scored
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.link);

  console.log(`[DEBUG STAGE 4: URLs selected for scraping] Selected: ${JSON.stringify(selected)}`);
  return selected;
}
