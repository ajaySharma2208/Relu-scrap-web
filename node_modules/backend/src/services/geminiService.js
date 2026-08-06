import { ai } from '../config/gemini.js';

/**
 * Sends the combined cleaned text to Gemini AI along with fallback metadata
 * to perform structured generation using JSON schema validation.
 */
export async function enrichCompanyData(cleanedText, fallbackMetadata) {
  const modelName = 'gemini-2.5-flash';
  
  const prompt = `
Analyze the following cleaned text extracted from a company's website. Your task is to extract key structured metadata and generate sales enrichment insights.

CRITICAL RULES:
1. Do NOT hallucinate, guess, or invent any information.
2. If a field is not explicitly found or cannot be confidently inferred from the text, return an empty string "" or an empty list [].
3. For "emails", "phoneNumber", and "address", check the text carefully. If they are not found, look at these fallback values extracted by our regex parser:
   - Fallback Emails: ${JSON.stringify(fallbackMetadata.emails)}
   - Fallback Phone Numbers: ${JSON.stringify(fallbackMetadata.phones)}
   - Fallback Company Name: ${JSON.stringify(fallbackMetadata.companyName)}
   Merge these with anything you find in the text, prioritizing direct text contents.
4. "outreachOpener" should be a personalized, highly engaging email opening sentence tailored to the company's value proposition.

Website Content:
---
${cleanedText.slice(0, 30000)}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            companyName: { type: 'STRING', description: 'The official name of the company' },
            address: { type: 'STRING', description: 'The physical corporate address or office location' },
            phoneNumber: { type: 'STRING', description: 'The primary contact phone number' },
            emails: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of corporate contact emails'
            },
            coreService: { type: 'STRING', description: 'A short description of the core service/product offered' },
            targetCustomer: { type: 'STRING', description: 'The ideal target customer profile' },
            probablePainPoint: { type: 'STRING', description: 'The main customer pain point solved by this company' },
            outreachOpener: { type: 'STRING', description: 'A personalized, friendly sales outreach opener line' }
          },
          required: [
            'companyName',
            'address',
            'phoneNumber',
            'emails',
            'coreService',
            'targetCustomer',
            'probablePainPoint',
            'outreachOpener'
          ]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini AI');
    }

    const parsedData = JSON.parse(responseText);
    
    // Normalize properties to ensure no nulls/undefineds
    return {
      companyName: (parsedData.companyName || fallbackMetadata.companyName || '').trim(),
      address: (parsedData.address || '').trim(),
      phoneNumber: (parsedData.phoneNumber || (fallbackMetadata.phones[0] || '')).trim(),
      emails: Array.isArray(parsedData.emails) 
        ? Array.from(new Set([...parsedData.emails, ...fallbackMetadata.emails].map(e => e.toLowerCase().trim())))
        : fallbackMetadata.emails,
      coreService: (parsedData.coreService || '').trim(),
      targetCustomer: (parsedData.targetCustomer || '').trim(),
      probablePainPoint: (parsedData.probablePainPoint || '').trim(),
      outreachOpener: (parsedData.outreachOpener || '').trim(),
    };
  } catch (error) {
    console.error('Error with Gemini AI Enrichment:', error);
    // Return graceful default structure with local regex/meta fallbacks
    return {
      companyName: fallbackMetadata.companyName || '',
      address: '',
      phoneNumber: fallbackMetadata.phones[0] || '',
      emails: fallbackMetadata.emails,
      coreService: '',
      targetCustomer: '',
      probablePainPoint: '',
      outreachOpener: '',
    };
  }
}
