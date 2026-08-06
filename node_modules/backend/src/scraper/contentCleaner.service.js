import * as cheerio from 'cheerio';

/**
 * Sanitizes a single HTML string by removing layout and script tags,
 * and extracting unique heading and paragraph strings.
 * 
 * @param {string} html - Raw HTML source of a webpage.
 * @returns {string[]} Array of clean visible text paragraphs/headings.
 */
function cleanSingleHtmlPage(html) {
  if (!html || typeof html !== 'string') return [];
  
  try {
    const $ = cheerio.load(html);
    
    // 1. Remove unwanted nodes
    const elementsToRemove = [
      'script', 'style', 'noscript', 'iframe', 'svg', 
      'header', 'footer', 'nav', 'aside',
      'form', 'button', 'input', 'select', 'textarea',
      '.cookie-banner', '#cookie-banner', '.cookie-consent',
      '[id*="cookie" i]', '[class*="cookie" i]',
      '[class*="modal" i]', '[id*="modal" i]',
      '[class*="popup" i]', '[id*="popup" i]',
      '[class*="newsletter" i]', '[class*="ads" i]', '[id*="ads" i]',
      '.menu', '#menu', '.sidebar', '#sidebar', '.social', '.comments', '#comments'
    ];
    
    elementsToRemove.forEach(selector => {
      try {
        $(selector).remove();
      } catch {
        // Ignore invalid selectors
      }
    });

    // 2. Remove comments
    $('*').contents().each((_, node) => {
      if (node.type === 'comment') {
        $(node).remove();
      }
    });

    // 3. Collect visible headings and paragraphs
    const textBlocks = [];
    $('h1, h2, h3, h4, h5, h6, p').each((_, el) => {
      const blockText = $(el).text().trim();
      if (blockText) {
        // Replace interior tabs/newlines with standard spacing
        const normalized = blockText.replace(/\s+/g, ' ');
        textBlocks.push(normalized);
      }
    });

    return textBlocks;
  } catch (err) {
    console.error(`[Content Cleaner] Error cleaning HTML page:`, err.message);
    return [];
  }
}

/**
 * Combines and deduplicates text blocks from multiple pages and counts tokens.
 * 
 * @param {string[]} htmlPages - Array of scraped raw HTML strings.
 * @returns {object} Structured object with cleanedText, wordCount, and estimatedTokens.
 */
export function cleanHtmlPages(htmlPages) {
  if (!Array.isArray(htmlPages) || htmlPages.length === 0) {
    return {
      cleanedText: '',
      wordCount: 0,
      estimatedTokens: 0
    };
  }

  const allBlocks = [];
  htmlPages.forEach(html => {
    const pageBlocks = cleanSingleHtmlPage(html);
    allBlocks.push(...pageBlocks);
  });

  // Remove duplicate paragraphs across pages (e.g. repetitive layout details)
  const uniqueBlocks = Array.from(new Set(allBlocks));

  // Merge into plain text with line breaks
  const cleanedText = uniqueBlocks.join('\n\n');
  
  // Counts
  const wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
  // Standard token heuristic: ~4 characters per token
  const estimatedTokens = Math.ceil(cleanedText.length / 4);

  console.log(`[DEBUG STAGE 6: HTML cleaning result length] Length: ${cleanedText.length} characters`);
  console.log(`[DEBUG STAGE 7: First 1000 characters of cleaned text] Sample:\n${cleanedText.slice(0, 1000)}\n--- END OF SAMPLE ---`);

  return {
    cleanedText,
    wordCount,
    estimatedTokens
  };
}
