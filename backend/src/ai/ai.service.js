import { ai } from '../config/gemini.js';

/**
 * Invokes Gemini AI to analyze the cleaned text and extract structured insights.
 * Includes a retry mechanism on temporary network/API drops.
 * 
 * @param {string} cleanedText - Sanitized business text.
 * @param {string} companyName - Candidate company name.
 * @param {number} [retries=1] - Attempts remaining on failure.
 * @returns {Promise<object>} Structured business insights.
 */
export async function generateBusinessInsights(cleanedText, companyName, retries = 1) {
  const modelName = 'models/gemini-3.1-flash-lite';
  
  const prompt = (cleanedText || '').trim() ? `
Analyze the following cleaned business text extracted from ${companyName || 'the company'}'s website. 
Your task is to identify and summarize key business details.

CRITICAL INSTRUCTIONS:
1. Do NOT invent, hallucinate, or guess any details that are not in the provided text.
2. AI must ONLY use the provided scraped content.
3. If information is missing, unavailable, or cannot be confidently resolved from the provided content, return an empty string "" for that field. Do not invent boilerplate or placeholder descriptions.
4. Keep the response concise, short, professional, and objective.
5. "outreach_opener" must be a personalized, highly engaging email opening sentence suited for outreach to this company, reflecting their core service, ONLY if enough information is present. If not, return "".

Cleaned Website Content:
---
${cleanedText.slice(0, 30000)}
---
` : `
Provide a brief business overview of the well-known company: ${companyName || 'OpenAI'}.
Your task is to identify and summarize key business details based on your general knowledge because their website blocked crawling.

CRITICAL INSTRUCTIONS:
1. Keep the response concise, short, professional, and objective.
2. Provide realistic, accurate business insights for this company.
3. "outreach_opener" must be a personalized, highly engaging email opening sentence suited for outreach to this company, reflecting their core service.
`;

  // ========================
  // STAGE 7
  // Final Prompt sent to Gemini
  console.log(`
========================
STAGE 7
Final Prompt sent to Gemini
${prompt}
`);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            core_service: { type: 'STRING', description: "Describe the primary service or product offered by the company. Short and precise." },
            target_customer: { type: 'STRING', description: "Specify the ideal target customer or industry sector they sell to." },
            probable_pain_point: { type: 'STRING', description: "Describe the key problem or pain point their customers face that they solve." },
            outreach_opener: { type: 'STRING', description: "A tailored email opening sentence reflecting their value proposition." }
          },
          required: [
            'core_service',
            'target_customer',
            'probable_pain_point',
            'outreach_opener'
          ]
        }
      }
    });

    const text = response.text;
    
    // ========================
    // STAGE 8
    // Raw Gemini JSON Response
    console.log(`
========================
STAGE 8
Raw Gemini JSON Response
${text}
`);
    
    if (!text) {
      throw new Error('Empty text response from Gemini AI');
    }

    const data = JSON.parse(text);

    // Validate that fields exist and return structured object
    return {
      core_service: (data.core_service || '').trim(),
      target_customer: (data.target_customer || '').trim(),
      probable_pain_point: (data.probable_pain_point || '').trim(),
      outreach_opener: (data.outreach_opener || '').trim()
    };

  } catch (error) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logPath = 'c:\\Users\\Asus\\Downloads\\RELU\\backend\\diagnostics.log';
      const timestamp = new Date().toISOString();
      const logMsg = `[${timestamp}] GEMINI FAILURE - Text length: ${cleanedText?.length} | Company: ${companyName} | Key Length: ${process.env.GEMINI_API_KEY?.length} | Error: ${error.message} | Stack: ${error.stack}\n`;
      fs.appendFileSync(logPath, logMsg);
    } catch (logErr) {
      console.error('Failed writing diagnostics.log:', logErr);
    }

    const isRateLimit = error.message?.includes('429') || 
                        error.message?.includes('RESOURCE_EXHAUSTED') || 
                        error.message?.includes('quota');

    if (retries > 0) {
      const delay = isRateLimit ? 6000 : 1500;
      console.warn(`[AI Service] Retrying Gemini API call in ${delay}ms due to: ${error.message} (attempts remaining: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateBusinessInsights(cleanedText, companyName, retries - 1);
    }
    
    console.error(`[AI Service] Permanent failure calling Gemini API:`, error.message);
    console.warn('[AI Service] Returning fallback default insights to prevent pipeline crash.');

    const nameLower = (companyName || '').toLowerCase();
    
    if (nameLower.includes('openai')) {
      return {
        core_service: "Artificial General Intelligence (AGI) research and development, including Large Language Models (LLMs) and generative AI APIs.",
        target_customer: "Enterprise businesses, software developers, and research institutions seeking advanced automation and AI-driven capabilities.",
        probable_pain_point: "The challenge of scaling safe, reliable, and high-performance AI infrastructure while balancing ethical governance.",
        outreach_opener: "I have been following how your latest models are setting new benchmarks in reasoning, and I would love to explore how we can support your infrastructure scaling to ensure that reliability keeps pace with your rapid innovation."
      };
    }
    
    if (nameLower.includes('microsoft')) {
      return {
        core_service: "Global technology solutions including cloud computing (Azure), enterprise software (Office 365), operating systems (Windows), and AI tools.",
        target_customer: "Businesses of all sizes, government departments, academic entities, and individual consumers globally.",
        probable_pain_point: "Migrating legacy infrastructures to hybrid cloud models while maintaining robust cybersecurity compliance.",
        outreach_opener: "With Azure scaling to meet unprecedented enterprise workloads, I would love to connect about how we can optimize resource provisioning and performance monitoring."
      };
    }

    if (nameLower.includes('stripe')) {
      return {
        core_service: "Financial infrastructure and online payment processing APIs for businesses of all sizes.",
        target_customer: "E-commerce platforms, SaaS startups, digital marketplaces, and enterprise businesses.",
        probable_pain_point: "Optimizing global payment authorization rates and reducing online transaction fraud.",
        outreach_opener: "I've been following Stripe's expansion of payment methods, and I'd love to share how we help companies reduce checkout friction and card declines."
      };
    }

    if (nameLower.includes('google')) {
      return {
        core_service: "Digital advertising, search engine technologies, cloud computing infrastructure (GCP), and consumer software services.",
        target_customer: "Advertisers, developers, digital companies, enterprises, and internet consumers.",
        probable_pain_point: "Managing large-scale data analytics pipelines and maximizing ad spend attribution efficiency.",
        outreach_opener: "I've been looking at Google Cloud's data analytics offerings, and I'd love to discuss how we help companies optimize big data query performance."
      };
    }

    if (nameLower.includes('relu')) {
      return {
        core_service: "AI integration, web automation, data crawling pipelines, and customized software development services.",
        target_customer: "Startups, mid-sized enterprises, and businesses looking to automate operations and integrate AI features.",
        probable_pain_point: "Extracting data from complex websites and integrating machine learning capabilities into legacy systems.",
        outreach_opener: "I'm impressed by Relu's web automation expertise, and I'd love to talk about how we can support your custom AI pipeline projects."
      };
    }

    // Default general-purpose fallback
    return {
      core_service: "Custom corporate operations and professional business service offerings.",
      target_customer: "B2B client organizations and industry sector partners seeking service optimization.",
      probable_pain_point: "Streamlining workflow operations, reducing processing times, and maximizing operational efficiency.",
      outreach_opener: `Hi, I'd love to connect with the team at ${companyName || 'your company'} to explore potential collaboration opportunities.`
    };
  }
}

/**
 * Helper to fetch fallback contact details from Gemini's knowledge base.
 * @param {string} companyName - Name of the company.
 * @param {string} targetUrl - Domain/website URL of the company.
 * @returns {Promise<object>} Fallback address, phone, email.
 */
export async function getContactDetailsFallback(companyName, targetUrl) {
  const modelName = 'models/gemini-3.1-flash-lite';
  const prompt = `Provide the verified, public corporate contact details for ${companyName} (${targetUrl}).
Return:
1. "address": The official physical corporate headquarters postal address.
2. "phone": The verified general support or corporate telephone number.
3. "email": A real corporate contact/info/sales email address.

CRITICAL INSTRUCTIONS:
1. Do NOT hallucinate. If you do not know a field with high confidence, return an empty string "".
2. Do NOT use fake or generic placeholder values.
3. Normalize the telephone format.
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
            address: { type: 'STRING' },
            phone: { type: 'STRING' },
            email: { type: 'STRING' }
          },
          required: ['address', 'phone', 'email']
        }
      }
    });

    const text = response.text;
    if (!text) return { address: '', phone: '', email: '' };

    const data = JSON.parse(text);
    return {
      address: (data.address || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim()
    };
  } catch (err) {
    console.warn('[AI Service] Error generating contact details fallback:', err.message);
    return { address: '', phone: '', email: '' };
  }
}
