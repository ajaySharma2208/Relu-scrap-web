import * as cheerio from 'cheerio';

/**
 * Extracts metadata (Title, Description, Canonical URL) using cheerio.
 */
export function extractPageMetadata(html) {
  if (!html) {
    return {
      title: '',
      metaDescription: '',
      canonicalUrl: ''
    };
  }

  try {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    
    // Check various description tags
    const metaDescription = 
      $('meta[name="description"]').attr('content')?.trim() || 
      $('meta[property="og:description"]').attr('content')?.trim() || 
      '';
      
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';
    
    return {
      title,
      metaDescription,
      canonicalUrl
    };
  } catch (error) {
    console.error(`[Content Extractor] Metadata parse failure:`, error.message);
    return {
      title: '',
      metaDescription: '',
      canonicalUrl: ''
    };
  }
}

/**
 * Uses regex patterns to extract structured contacts (emails, phones, social links).
 */
export function extractStructuredData(html) {
  if (!html) {
    return {
      emails: [],
      phones: [],
      socialLinks: []
    };
  }

  // Load cheerio to parse structured elements and links
  let $;
  try {
    $ = cheerio.load(html);
  } catch (err) {
    console.error(`[Content Extractor] Cheerio load failed:`, err.message);
    return { emails: [], phones: [], socialLinks: [] };
  }

  const emailsMatches = [];
  const phoneMatches = [];

  // 1. Parse mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    let email = $(el).attr('href').replace(/^mailto:/i, '').trim();
    email = email.split('?')[0]; // strip query parameters
    if (email) emailsMatches.push(email);
  });

  // 2. Parse tel: links
  $('a[href^="tel:"]').each((_, el) => {
    let tel = $(el).attr('href').replace(/^tel:/i, '').trim();
    tel = tel.split('?')[0]; // strip query parameters
    if (tel) phoneMatches.push(tel);
  });

  // 3. Parse JSON-LD for emails & telephones
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text();
      const json = JSON.parse(text);
      
      const traverseJson = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.email && typeof obj.email === 'string') {
          emailsMatches.push(obj.email);
        }
        if (obj.telephone && typeof obj.telephone === 'string') {
          phoneMatches.push(obj.telephone);
        }
        
        if (Array.isArray(obj)) {
          obj.forEach(traverseJson);
        } else {
          for (const k in obj) {
            traverseJson(obj[k]);
          }
        }
      };
      
      traverseJson(json);
    } catch {}
  });

  // 4. Parse Microdata itemprop elements
  $('[itemprop="email"]').each((_, el) => {
    const text = $(el).text().trim() || $(el).attr('content')?.trim();
    if (text) emailsMatches.push(text);
  });
  $('[itemprop="telephone"]').each((_, el) => {
    const text = $(el).text().trim() || $(el).attr('content')?.trim();
    if (text) phoneMatches.push(text);
  });

  // Strip scripts and styles first to get clean body text for regex scanning
  let visibleText = '';
  try {
    const clean$ = cheerio.load(html);
    clean$('script, style, noscript, svg, iframe').remove();
    visibleText = clean$('body').text();
  } catch {
    visibleText = html;
  }

  // 5. Fallback Regex email matching
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const regexEmails = html.match(emailRegex) || [];
  emailsMatches.push(...regexEmails);

  const fakeEmailPatterns = [
    'example.com',
    'sentry.io',
    'localhost',
    'test@',
    'sample@',
    'demo@',
    'noreply@',
    'no-reply@',
    'user@',
    'yourname@',
    'yourbusiness.com',
    'domain.com',
    'email.com',
    'company.com',
    'w3.org',
    'bootstrap',
    'tailwind',
    'jquery'
  ];

  const emails = Array.from(new Set(
    emailsMatches
      .map(e => e.toLowerCase().trim())
      .filter(e => {
        if (!e || e.includes('..') || !e.includes('@')) return false;
        
        const isFake = fakeEmailPatterns.some(pattern => {
          if (pattern.endsWith('@')) {
            return e.startsWith(pattern);
          }
          return e.includes(pattern);
        });
        
        return !isFake;
      })
  ));

  // 6. Fallback Regex Phone matching
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/g;
  const regexPhones = visibleText.match(phoneRegex) || [];
  phoneMatches.push(...regexPhones);

  const phones = Array.from(new Set(
    phoneMatches
      .map(p => {
        const clean = p.trim();
        const digits = clean.replace(/\D/g, '');
        // Normalize: if it starts with a plus, keep the plus prefix followed by digits
        if (clean.startsWith('+') && digits.length >= 7) {
          return '+' + digits;
        }
        return clean;
      })
      .filter(p => {
        const digits = p.replace(/\D/g, '');
        // Ignore numbers shorter than 7 digits or longer than 15 digits
        if (digits.length < 7 || digits.length > 15) return false;
        
        // Exclude typical year strings
        if (/^[12]\d{3}$/.test(p.replace(/\s+/g, ''))) return false;

        // Ignore obvious repeats or fake incremental tracking IDs
        if (/^(.)\1+$/.test(digits)) return false;
        if (digits === '1234567' || digits === '12345678' || digits === '1234567890') return false;

        // If the number is longer than 10 digits and has no formatting (no +, -, space, or parenthesis),
        // it is likely a false positive correlation ID / correlation vector token from CDNs/scripts
        if (digits.length > 10 && !/[\s\-\(\)\+]/.test(p)) return false;

        return true;
      })
  ));

  // 7. Social Media Links Regex
  const socialRegex = /(?:https?:)?\/\/(?:www\.)?(?:linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com)\/[a-zA-Z0-9._%+-/#?=-]+/gi;
  const socialMatches = html.match(socialRegex) || [];
  const socialLinks = Array.from(new Set(socialMatches.map(link => {
    let cleanLink = link.trim();
    if (cleanLink.startsWith('//')) {
      cleanLink = 'https:' + cleanLink;
    }
    return cleanLink;
  })));

  return {
    emails,
    phones,
    socialLinks
  };
}
