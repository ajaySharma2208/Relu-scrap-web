import { XMLParser } from 'fast-xml-parser';
import { fetchPageHtml } from './crawler.service.js';
import { URL } from 'url';

const MAX_SITEMAP_DEPTH = 2; // Prevent deep/infinite loops on nested sitemap indexes

/**
 * Recursively fetches and parses sitemaps, handling sitemap index nested files.
 * 
 * @param {string} sitemapUrl - Current sitemap URL.
 * @param {string} originUrl - Base domain origin to filter internal links only.
 * @param {number} [depth=1] - Recursion depth tracker.
 * @returns {Promise<string[]>} List of extracted webpage URLs.
 */
async function crawlSitemapRecursive(sitemapUrl, originUrl, depth = 1) {
  if (depth > MAX_SITEMAP_DEPTH) {
    return [];
  }

  console.log(`[Sitemap Service] Fetching sitemap: ${sitemapUrl} (Depth: ${depth}/${MAX_SITEMAP_DEPTH})`);
  
  try {
    const result = await fetchPageHtml(sitemapUrl, 0);
    const xmlText = result.success ? result.html : '';
    
    if (!xmlText || typeof xmlText !== 'string') {
      return [];
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true, // Strips namespace prefixes like <sm:loc>
    });
    
    const jsonObj = parser.parse(xmlText);
    const extractedUrls = [];

    // Traverse JSON tree to locate loc tags
    const extractLocs = (obj) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(item => extractLocs(item));
      } else if (typeof obj === 'object') {
        for (const key in obj) {
          if (key.toLowerCase() === 'loc') {
            const locVal = obj[key];
            if (typeof locVal === 'string') {
              extractedUrls.push(locVal.trim());
            } else if (typeof locVal === 'object' && locVal['#text']) {
              extractedUrls.push(locVal['#text'].trim());
            }
          } else {
            extractLocs(obj[key]);
          }
        }
      }
    };

    extractLocs(jsonObj);

    // Deduplicate and filter out invalid links
    const rawLinks = Array.from(new Set(extractedUrls)).filter(url => /^https?:\/\//i.test(url)).slice(0, 300);
    
    const pages = [];
    const subSitemaps = [];

    const targetHost = new URL(originUrl).hostname.replace(/^www\./i, '');

    // Separate webpage URLs from child sitemap XMLs
    rawLinks.forEach(link => {
      try {
        const parsedLink = new URL(link);
        const linkHost = parsedLink.hostname.replace(/^www\./i, '');
        
        // Only process internal links that belong to target domain or subdomains
        if (linkHost === targetHost || linkHost.endsWith('.' + targetHost)) {
          const isXml = parsedLink.pathname.toLowerCase().endsWith('.xml') || 
                        parsedLink.pathname.toLowerCase().includes('sitemap');
          if (isXml) {
            subSitemaps.push(link);
          } else {
            pages.push(link);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    });

    // If sub-sitemaps are found, crawl them recursively (limit to top 5 to keep it fast)
    if (subSitemaps.length > 0) {
      console.log(`[Sitemap Service] Discovered ${subSitemaps.length} sub-sitemaps in ${sitemapUrl}. Processing top 5 recursively...`);
      const subPromises = subSitemaps.slice(0, 5).map(subUrl => crawlSitemapRecursive(subUrl, originUrl, depth + 1));
      const subResults = await Promise.all(subPromises);
      subResults.forEach(subUrls => pages.push(...subUrls));
    }

    return pages;
  } catch (error) {
    console.warn(`[Sitemap Service] Error crawling sitemap ${sitemapUrl}:`, error.message);
    return [];
  }
}

/**
 * Service to fetch and parse sitemap.xml.
 * Gracefully falls back if sitemap index is missing.
 * 
 * @param {string} baseUrl - Normalized base URL of target company.
 * @returns {Promise<string[]>} Deduped internal links list.
 */
export async function fetchAndParseSitemap(baseUrl) {
  let originUrl = '';
  try {
    originUrl = new URL(baseUrl).origin;
  } catch {
    console.error(`[Sitemap Service] Base URL origin extraction failed: ${baseUrl}`);
    return [];
  }

  const rootSitemapUrl = `${originUrl}/sitemap.xml`;
  
  try {
    const urls = await crawlSitemapRecursive(rootSitemapUrl, originUrl, 1);
    const uniqueUrls = Array.from(new Set(urls.map(url => url.replace(/\/$/, ''))));
    
    console.log(`[DEBUG STAGE 3: sitemap.xml status] URL: ${rootSitemapUrl} | Found: ${uniqueUrls.length > 0} | URLs count: ${uniqueUrls.length}`);
    return uniqueUrls;
  } catch (error) {
    console.log(`[DEBUG STAGE 3: sitemap.xml status] URL: ${rootSitemapUrl} | Found: false | Error: ${error.message}`);
    return [];
  }
}
