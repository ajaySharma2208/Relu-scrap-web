import { Company } from '../models/Company.js';
import { scrapeWebsite, normalizeUrl } from '../scraper/index.js';

/**
 * Controller to handle POST /enrich.
 * Coordinates the full Smart Scraper & Gemini AI sequence,
 * and saves/upserts the results in MongoDB Atlas.
 */
export const enrichCompany = async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      res.status(400).json({ error: 'Both website name and website URL are required.' });
      return;
    }
    
    const normalizedUrl = normalizeUrl(url);
    console.log(`[Enrich Controller] Initiating pipeline for website: ${name} (${normalizedUrl})`);

    // Execute the unified scraper and AI coordinator
    const scraperResult = await scrapeWebsite(normalizedUrl);

    // ----------------------------------------------------
    // Production Hardening & Pre-save Validation Layer
    // ----------------------------------------------------

    // 1. Company Name validation (never empty, not a URL)
    let validatedCompanyName = (scraperResult.company_name || name || '').trim();
    if (/^https?:\/\//i.test(validatedCompanyName)) {
      validatedCompanyName = name.trim();
    }
    
    // 2. Email validation (check valid format, exclude duplicates, remove empty, and filter fake patterns)
    const validEmails = Array.isArray(scraperResult.mail)
      ? scraperResult.mail
          .map(e => e.toLowerCase().trim())
          .filter(e => {
            const emailFormatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailFormatRegex.test(e)) return false;
            
            const fakePatterns = ['example.com', 'sentry.io', 'localhost', 'test@', 'sample@', 'demo@', 'noreply@', 'no-reply@', 'user@', 'yourname@'];
            return !fakePatterns.some(pat => {
              if (pat.endsWith('@')) return e.startsWith(pat);
              return e.includes(pat);
            });
          })
      : [];
    const deduplicatedEmails = Array.from(new Set(validEmails));

    // 3. Phone validation
    let validatedPhone = (scraperResult.mobile_number || '').trim();
    if (validatedPhone) {
      const cleanDigits = validatedPhone.replace(/\D/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15 || /^(.)\1+$/.test(cleanDigits) || cleanDigits === '1234567' || cleanDigits === '12345678') {
        validatedPhone = '';
      }
    }

    // 4. Address validation (ensure no generic placeholder strings or short copyright-like lines)
    let validatedAddress = (scraperResult.address || '').trim();
    if (validatedAddress.length < 5 || /©|copyright|all rights reserved|privacy policy|cookie/i.test(validatedAddress)) {
      validatedAddress = '';
    }

    // 5. AI Fields Validation
    const validateAIField = (val) => {
      const v = (val || '').trim();
      const lower = v.toLowerCase();
      if (
        lower.includes('i do not have') || 
        lower.includes('i am unable') || 
        lower.includes('not mentioned') || 
        lower.includes('no information') || 
        lower.includes('cannot be confidently resolved') ||
        lower.includes('based on the provided text')
      ) {
        return '';
      }
      return v;
    };

    const companyData = {
      websiteName: name.trim(),
      websiteUrl: normalizedUrl,
      companyName: validatedCompanyName,
      address: validatedAddress,
      phoneNumber: validatedPhone,
      emails: deduplicatedEmails,
      coreService: validateAIField(scraperResult.core_service),
      targetCustomer: validateAIField(scraperResult.target_customer),
      probablePainPoint: validateAIField(scraperResult.probable_pain_point),
      outreachOpener: validateAIField(scraperResult.outreach_opener),
      createdAt: new Date()
    };

    // ========================
    // STAGE 9
    // Final MongoDB document
    console.log(`
========================
STAGE 9
Final MongoDB document
${JSON.stringify(companyData, null, 2)}
`);

    // Upsert record to prevent duplicate entries based on websiteUrl
    const savedCompany = await Company.findOneAndUpdate(
      { websiteUrl: normalizedUrl },
      companyData,
      { upsert: true, new: true }
    );

    console.log(`[Enrich Controller] Successfully processed & stored: ${savedCompany.companyName}`);
    res.status(200).json(savedCompany);
  } catch (error) {
    console.error('[Enrich Controller] Error executing enrichment pipeline:', error);
    res.status(500).json({ 
      error: 'Failed to enrich company data.', 
      details: error.message 
    });
  }
};

/**
 * Controller to handle GET /results.
 * Retrieves all saved companies ordered by latest insertion first.
 */
export const getResults = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    console.error('[Enrich Controller] Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
};

/**
 * Controller to handle DELETE /results/:id.
 * Removes a company record from the database.
 */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Record deleted successfully.' });
  } catch (error) {
    console.error('[Enrich Controller] Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
};
