import * as cheerio from 'cheerio';

/**
 * Parses and sanitizes HTML: extracts metadata, strips elements (nav, footer, ads, cookies),
 * and returns normalized, clean visible text.
 */
export function cleanHtml(html) {
  if (!html) {
    return {
      title: '',
      metaDescription: '',
      ogSiteName: '',
      ogTitle: '',
      cleanedText: '',
    };
  }

  const $ = cheerio.load(html);
  
  // 1. Extract metadata before cleaning
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim() || '';
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  
  // 2. Remove boilerplate, interactive, layout and widget selectors
  const selectorsToRemove = [
    'script',
    'style',
    'noscript',
    'iframe',
    'svg',
    'nav',
    'footer',
    'header',
    'form',
    'aside',
    '.cookie-banner',
    '#cookie-banner',
    '.cookie-consent',
    '[id*="cookie" i]',
    '[class*="cookie" i]',
    '[class*="banner" i]',
    '[id*="banner" i]',
    '[class*="modal" i]',
    '[id*="modal" i]',
    '[class*="popup" i]',
    '[id*="popup" i]',
    '[class*="newsletter" i]',
    '[class*="ads" i]',
    '[id*="ads" i]',
    '.menu',
    '#menu',
    '.sidebar',
    '#sidebar',
    '.social',
    '.comments',
    '#comments',
  ];
  
  selectorsToRemove.forEach(selector => {
    try {
      $(selector).remove();
    } catch {
      // Ignore selectors that fail parsing
    }
  });

  // 3. Extract text from the remaining HTML body
  const bodyText = $('body').text();
  
  // 4. Normalize spacing
  const cleanedText = bodyText
    .replace(/\s+/g, ' ')  // Replace multiple tabs/newlines/spaces with a single space
    .trim();
    
  return {
    title,
    metaDescription,
    ogSiteName,
    ogTitle,
    cleanedText,
  };
}
