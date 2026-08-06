/**
 * Service to extract structured metadata locally from clean page text using patterns.
 */

/**
 * Extracts all unique email addresses from a given block of text.
 */
export function extractEmails(text) {
  if (!text) return [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return Array.from(new Set(matches.map(email => email.toLowerCase())));
}

/**
 * Extracts phone numbers using standard international and local patterns.
 */
export function extractPhones(text) {
  if (!text) return [];
  // Pattern to match standard telephone numbers (including international + prefix)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  
  return Array.from(new Set(matches))
    .map(phone => phone.trim())
    .filter(phone => {
      const digits = phone.replace(/\D/g, '');
      // Exclude simple year patterns (e.g. 2026) and confirm realistic digit lengths
      return digits.length >= 7 && digits.length <= 15 && !/^[12]\d{3}$/.test(phone);
    });
}

/**
 * Extracts a candidate company name from the website title or page headers.
 * Usually page titles contain "Company Name | Services" or "Company Name - About Us".
 */
export function extractCompanyNameFromTitle(title) {
  if (!title) return '';
  
  // Split title by common delimiters
  const delimiters = ['|', '-', '—', '–', '•'];
  for (const delimiter of delimiters) {
    if (title.includes(delimiter)) {
      const parts = title.split(delimiter);
      // Usually the first part is the company name, unless it's a subpage (then it might be the last part)
      const candidate1 = parts[0].trim();
      const candidate2 = parts[parts.length - 1].trim();
      
      // Select the one that looks more like a company name (usually shorter or does not contain common page words)
      const pageWords = ['home', 'about', 'services', 'contact', 'welcome', 'solutions', 'product'];
      const c1Lower = candidate1.toLowerCase();
      const c2Lower = candidate2.toLowerCase();
      
      const c1HasPageWord = pageWords.some(word => c1Lower.includes(word));
      const c2HasPageWord = pageWords.some(word => c2Lower.includes(word));
      
      if (!c1HasPageWord && c2HasPageWord) return candidate1;
      if (c1HasPageWord && !c2HasPageWord) return candidate2;
      
      return candidate1.length <= candidate2.length ? candidate1 : candidate2;
    }
  }
  
  return title;
}
