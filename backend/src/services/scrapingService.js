import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

// Set standard User-Agent to avoid blocking
const AXIOS_CONFIG = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
  timeout: 8000, // 8 seconds timeout
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
};

/**
 * Normalizes URL to make sure it includes protocol and has no trailing slash (unless it is root)
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
 * Tries to parse sitemap.xml to find all internal pages.
 */
async function getLinksFromSitemap(baseUrl) {
  const normalizedBase = normalizeUrl(baseUrl);
  const sitemapUrl = `${normalizedBase}/sitemap.xml`;
  
  try {
    const response = await axios.get(sitemapUrl, AXIOS_CONFIG);
    const content = response.data;
    if (typeof content !== 'string') return [];

    // Extract all <loc> tags content
    const locRegex = /<loc>(https?:\/\/[^\s<]+)<\/loc>/gi;
    const links = [];
    let match;
    while ((match = locRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Filter internal links only
    const origin = new URL(normalizedBase).origin;
    return links.filter(link => {
      try {
        return new URL(link).origin === origin;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.log(`Sitemap not available or failed for ${sitemapUrl}:`, error.message);
    return [];
  }
}

/**
 * Fallback to scraping the homepage to find internal hrefs.
 */
async function getLinksFromHomepage(baseUrl) {
  const normalizedBase = normalizeUrl(baseUrl);
  try {
    const response = await axios.get(normalizedBase, AXIOS_CONFIG);
    const html = response.data;
    if (!html) return [];
    
    const $ = cheerio.load(html);
    const linksSet = new Set();
    const origin = new URL(normalizedBase).origin;
    
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        // Resolve relative URL
        const absoluteUrl = new URL(href, normalizedBase);
        // Only keep links with the same origin
        if (absoluteUrl.origin === origin) {
          // Remove hash/fragment
          absoluteUrl.hash = '';
          // Remove trailing slash to prevent duplicates
          const cleanedLink = absoluteUrl.href.replace(/\/$/, '');
          linksSet.add(cleanedLink);
        }
      } catch {
        // Ignore invalid URL structures
      }
    });
    
    return Array.from(linksSet);
  } catch (error) {
    console.error(`Failed to scrape homepage links for ${normalizedBase}:`, error.message);
    return [];
  }
}

/**
 * Scores a URL path to see how relevant it is for sales/company enrichment
 */
function getUrlScore(url) {
  const lowerUrl = url.toLowerCase();
  
  // Exclusions (negative score)
  const excludeKeywords = [
    'blog', 'news', 'careers', 'jobs', 'privacy', 'terms', 'cookie', 
    'wp-content', 'wp-includes', 'tag', 'category', 'login', 'register', 
    'cart', 'checkout', 'my-account', 'portfolio', 'gallery', 'event',
    'feed', 'rss', 'xml', 'pdf', 'jpg', 'png', 'gif'
  ];
  
  if (excludeKeywords.some(kw => lowerUrl.includes(kw))) {
    return -100;
  }
  
  // High priority keywords (+10)
  const highPriorityKeywords = [
    'about', 'contact', 'service', 'product', 'solution', 
    'what-we-do', 'who-we-are', 'contact-us', 'about-us', 
    'pricing', 'faq', 'team', 'company', 'feature'
  ];
  
  let score = 0;
  for (const kw of highPriorityKeywords) {
    if (lowerUrl.includes(kw)) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Discovers and returns the top relevant internal links to crawl
 */
export async function getTargetUrls(baseUrl, limit = 5) {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // 1. Try sitemap first
  let discovered = await getLinksFromSitemap(normalizedBase);
  
  // 2. Fallback to homepage extraction
  if (discovered.length === 0) {
    discovered = await getLinksFromHomepage(normalizedBase);
  }
  
  // Always include the homepage in discovered list (to make sure it's processed)
  if (!discovered.includes(normalizedBase)) {
    discovered.unshift(normalizedBase);
  }
  
  // 3. Score links
  const scoredLinks = discovered.map(link => ({
    link,
    score: link === normalizedBase ? 100 : getUrlScore(link), // Give homepage high priority
  }));
  
  // Filter out excluded links (score < 0) and sort descending by score
  const filtered = scoredLinks
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score);
  
  // Select top N links
  const resultLinks = filtered.slice(0, limit).map(item => item.link);
  
  console.log(`Discovered target URLs for ${normalizedBase}:`, resultLinks);
  return resultLinks;
}

/**
 * Fetches HTML content of a page
 */
export async function fetchPageHtml(url) {
  try {
    const response = await axios.get(url, AXIOS_CONFIG);
    return response.data || '';
  } catch (error) {
    console.error(`Failed to fetch page html for ${url}:`, error.message);
    return '';
  }
}
