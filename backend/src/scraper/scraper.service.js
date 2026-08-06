import { normalizeUrl, extractInternalLinks, getTopRelevantPages } from './pageSelector.service.js';
import { fetchAndParseSitemap } from './sitemap.service.js';
import { fetchPageHtml } from './crawler.service.js';
import { extractPageMetadata, extractStructuredData } from './contentExtractor.service.js';
import { cleanHtmlPages } from './contentCleaner.service.js';
import { extractStructuredInfo } from './structuredExtractor.service.js';
import { generateBusinessInsights, getContactDetailsFallback } from '../ai/ai.service.js';

/**
 * Main coordinator service to orchestrate website scraping and enrichment.
 * Performs crawling, HTML cleaning, metadata structuring, and Gemini AI analysis.
 * 
 * @param {string} rawUrl - Target company website URL.
 * @returns {Promise<object>} Combined structured company data and AI insights.
 */
export async function scrapeWebsite(rawUrl) {
  const targetUrl = normalizeUrl(rawUrl);
  
  // ========================
  // STAGE 1
  // Target URL
  console.log(`
========================
STAGE 1
Target URL
${targetUrl}
`);

  // 1. Discover target URLs from sitemap.xml
  let discoveredLinks = await fetchAndParseSitemap(targetUrl);
  let homepageHtml = '';

  // 2. Fallback to homepage crawling if sitemap is empty/failed
  if (discoveredLinks.length === 0) {
    console.log('[Scraper Coordinator] Sitemap returned no links. Falling back to homepage crawl.');
    const result = await fetchPageHtml(targetUrl);
    if (result.success) {
      homepageHtml = result.html;
      discoveredLinks = extractInternalLinks(homepageHtml, targetUrl);
    }
  }

  // Proactively inject common contact/about/privacy URLs into discoveredLinks candidate pool
  try {
    const origin = new URL(targetUrl).origin;
    const commonContactUrls = [
      `${origin}/contact`,
      `${origin}/contact-us`,
      `${origin}/about`,
      `${origin}/about-us`,
      `${origin}/privacy`,
      `${origin}/terms`
    ];
    commonContactUrls.forEach(cUrl => {
      if (!discoveredLinks.includes(cUrl)) {
        discoveredLinks.push(cUrl);
      }
    });
  } catch (err) {
    console.warn('[Scraper Coordinator] Error generating fallback URLs:', err.message);
  }

  // 3. Score and select Top 5 pages
  const selectedUrls = getTopRelevantPages(discoveredLinks, targetUrl, 5);

  // ========================
  // STAGE 2
  // Selected Pages
  console.log(`
========================
STAGE 2
Selected Pages
${JSON.stringify(selectedUrls, null, 2)}
`);

  // 4. Crawl selected pages concurrently
  console.log(`[Scraper Coordinator] Fetching ${selectedUrls.length} pages concurrently...`);
  const crawlTasks = selectedUrls.map(async (url) => {
    try {
      if (url === targetUrl && homepageHtml) {
        return { 
          url, 
          success: true, 
          html: homepageHtml,
          statusCode: 200,
          responseTime: 0,
          contentType: 'text/html'
        };
      }
      return await fetchPageHtml(url);
    } catch (err) {
      console.warn(`[Scraper Coordinator] Error fetching page URL ${url}:`, err.message);
      return { 
        url, 
        success: false, 
        html: '',
        statusCode: 500,
        responseTime: 0,
        contentType: '',
        error: err.message 
      };
    }
  });

  const pagesData = await Promise.all(crawlTasks);

  // ========================
  // STAGE 3
  // Downloaded HTML size for each page
  console.log(`
========================
STAGE 3
Downloaded HTML size for each page`);
  pagesData.forEach(page => {
    console.log(`${page.url}: ${page.success ? page.html.length : 'Failed/Blocked'} bytes`);
  });

  // 5. Run regex and local metadata parsers on each page
  const htmlPages = [];
  const allEmails = [];
  const allPhones = [];
  const allSocials = [];

  for (const page of pagesData) {
    if (!page.success || !page.html) continue;
    htmlPages.push(page.html);

    const contacts = extractStructuredData(page.html);
    allEmails.push(...contacts.emails);
    allPhones.push(...contacts.phones);
    allSocials.push(...contacts.socialLinks);
  }

  // Deduplicate intermediate regex matches
  const uniqueEmails = Array.from(new Set(allEmails));
  const uniquePhones = Array.from(new Set(allPhones));
  const uniqueSocials = Array.from(new Set(allSocials));

  // 6. Clean HTML pages (HTML Cleaner)
  const cleanedResult = cleanHtmlPages(htmlPages);

  // ========================
  // STAGE 4
  // Extracted Clean Text length
  console.log(`
========================
STAGE 4
Extracted Clean Text length
${cleanedResult.cleanedText.length}
`);

  // ========================
  // STAGE 5
  // First 1000 characters of cleaned text
  console.log(`
========================
STAGE 5
First 1000 characters of cleaned text
${cleanedResult.cleanedText.slice(0, 1000)}
`);

  // 7. Non-AI Structured Data Extraction
  const structuredData = extractStructuredInfo(htmlPages, {
    emails: uniqueEmails,
    phones: uniquePhones,
    socialLinks: uniqueSocials
  }, selectedUrls);

  // If local crawler got blocked (e.g. by Cloudflare 403) or found nothing, harvest public verified info from Gemini
  if (!structuredData.address || structuredData.mail.length === 0 || !structuredData.mobile_number) {
    console.log('[Scraper Coordinator] Local scraping yielded incomplete contact details. Fetching fallback values from Gemini AI...');
    try {
      const fallbackResult = await getContactDetailsFallback(structuredData.company_name || targetUrl, targetUrl);
      
      if (!structuredData.address && fallbackResult.address) {
        structuredData.address = fallbackResult.address;
        structuredData.address_source = 'Gemini AI Knowledge Base';
      }
      if (structuredData.mail.length === 0 && fallbackResult.email) {
        structuredData.mail = [fallbackResult.email];
      }
      if (!structuredData.mobile_number && fallbackResult.phone) {
        structuredData.mobile_number = fallbackResult.phone;
      }
    } catch (err) {
      console.warn('[Scraper Coordinator] Error fetching contact details fallback:', err.message);
    }
  }

  // ========================
  // STAGE 6
  // Structured Data extracted
  // Company Name
  // Address
  // Phone
  // Emails
  console.log(`
========================
STAGE 6
Structured Data extracted

Company Name: ${structuredData.company_name}

Address: ${structuredData.address}

Phone: ${structuredData.mobile_number}

Emails: ${JSON.stringify(structuredData.mail)}
`);

  // 8. Gemini AI Business Insights Generation
  console.log(`[Scraper Coordinator] Invoking Gemini AI for company: ${structuredData.company_name}`);
  const aiInsights = await generateBusinessInsights(
    cleanedResult.cleanedText,
    structuredData.company_name,
    3
  );

  console.log('[Scraper Coordinator] Scrape & AI enrichment pipeline complete.', {
    companyName: structuredData.company_name,
    emailsFound: structuredData.mail.length,
    coreServiceLength: aiInsights.core_service.length
  });
  // Compute Confidence Levels
  const websiteNameSource = structuredData.website_name ? 'HTML Title & Meta Tags' : 'Not Found';
  const websiteNameConfidence = structuredData.website_name ? 'High' : 'Low';

  const companyNameConfidence = (structuredData.company_name_source === 'Schema.org JSON-LD' || structuredData.company_name_source === 'OpenGraph Tags') ? 'High' 
    : (structuredData.company_name_source === 'HTML Page Title' || structuredData.company_name_source === 'Homepage H1 Element') ? 'Medium' 
    : 'Low';

  const addressConfidence = (structuredData.address_source !== 'Not Found') ? 'High' : 'Low';

  const phoneConfidence = structuredData.mobile_number ? 'High' : 'Low';
  const emailConfidence = structuredData.mail.length > 0 ? 'High' : 'Low';
  const socialConfidence = structuredData.social_links.length > 0 ? 'High' : 'Low';

  const coreServiceConfidence = aiInsights.core_service ? (cleanedResult.wordCount > 200 ? 'High' : 'Medium') : 'Low';
  const targetCustomerConfidence = aiInsights.target_customer ? (cleanedResult.wordCount > 200 ? 'High' : 'Medium') : 'Low';
  const painPointConfidence = aiInsights.probable_pain_point ? (cleanedResult.wordCount > 200 ? 'High' : 'Medium') : 'Low';
  const outreachOpenerConfidence = aiInsights.outreach_opener ? (cleanedResult.wordCount > 200 ? 'High' : 'Medium') : 'Low';

  console.log(`
==================================================
              CONFIDENCE ASSESSMENT
==================================================
Field Name: Website Name
Source: ${websiteNameSource}
Confidence: ${websiteNameConfidence}
--------------------------------------------------
Field Name: Company Name
Source: ${structuredData.company_name_source}
Confidence: ${companyNameConfidence}
--------------------------------------------------
Field Name: Address
Source: ${structuredData.address_source}
Confidence: ${addressConfidence}
--------------------------------------------------
Field Name: Mobile Number
Source: HTML Regex Scanning
Confidence: ${phoneConfidence}
--------------------------------------------------
Field Name: Emails
Source: HTML Mailto & Text Regex
Confidence: ${emailConfidence}
--------------------------------------------------
Field Name: Social Links
Source: Link Anchors Extraction
Confidence: ${socialConfidence}
--------------------------------------------------
Field Name: Core Service
Source: Gemini (gemini-flash-latest)
Confidence: ${coreServiceConfidence}
--------------------------------------------------
Field Name: Target Customer
Source: Gemini (gemini-flash-latest)
Confidence: ${targetCustomerConfidence}
--------------------------------------------------
Field Name: Probable Pain Point
Source: Gemini (gemini-flash-latest)
Confidence: ${painPointConfidence}
--------------------------------------------------
Field Name: Outreach Opener
Source: Gemini (gemini-flash-latest)
Confidence: ${outreachOpenerConfidence}
==================================================
`);

  const finalPayload = {
    website_name: structuredData.website_name,
    company_name: structuredData.company_name,
    address: structuredData.address,
    mobile_number: structuredData.mobile_number,
    mail: structuredData.mail,
    social_links: structuredData.social_links,
    cleanedText: cleanedResult.cleanedText,
    wordCount: cleanedResult.wordCount,
    estimatedTokens: cleanedResult.estimatedTokens,
    core_service: aiInsights.core_service,
    target_customer: aiInsights.target_customer,
    probable_pain_point: aiInsights.probable_pain_point,
    outreach_opener: aiInsights.outreach_opener
  };

  console.log(`[DEBUG STAGE 11: Final JSON before saving into MongoDB] Payload: ${JSON.stringify(finalPayload)}`);
  return finalPayload;
}
