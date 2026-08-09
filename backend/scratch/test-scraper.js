import { scrapeWebsite } from '../src/scraper/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars explicitly from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runTest() {
  console.log('--- Commencing End-to-End Scraper & AI Integration Test ---');
  
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  if (!hasApiKey) {
    console.warn('\n[WARNING] GEMINI_API_KEY is not defined in environment variables.');
    console.warn('The pipeline will run with a mock fallback return values for Gemini insights.\n');
  }

  const testUrl = 'https://microsoft.com';
  
  try {
    const result = await scrapeWebsite(testUrl);
    
    console.log('\n--- Complete Pipeline Output Validation ---');
    console.log('Returned Schema keys:', Object.keys(result));
    console.log('website_name:', JSON.stringify(result.website_name));
    console.log('company_name:', JSON.stringify(result.company_name));
    console.log('address:', JSON.stringify(result.address));
    console.log('mobile_number:', JSON.stringify(result.mobile_number));
    console.log('mail:', result.mail);
    console.log('social_links:', result.social_links);
    console.log('wordCount:', result.wordCount);
    console.log('estimatedTokens:', result.estimatedTokens);
    
    console.log('\n--- Gemini AI Enriched Insights ---');
    console.log('core_service:', JSON.stringify(result.core_service));
    console.log('target_customer:', JSON.stringify(result.target_customer));
    console.log('probable_pain_point:', JSON.stringify(result.probable_pain_point));
    console.log('outreach_opener:', JSON.stringify(result.outreach_opener));
    
    const isValidSchema = 
      typeof result.website_name === 'string' &&
      typeof result.company_name === 'string' &&
      typeof result.address === 'string' &&
      typeof result.mobile_number === 'string' &&
      Array.isArray(result.mail) &&
      Array.isArray(result.social_links) &&
      typeof result.cleanedText === 'string' &&
      typeof result.wordCount === 'number' &&
      typeof result.estimatedTokens === 'number' &&
      typeof result.core_service === 'string' &&
      typeof result.target_customer === 'string' &&
      typeof result.probable_pain_point === 'string' &&
      typeof result.outreach_opener === 'string';
      
    if (isValidSchema) {
      console.log('\n[SUCCESS] Pipeline returned schema exactly matching Step 5 specifications!');
    } else {
      console.error('\n[ERROR] Pipeline schema layout mismatch.');
    }
  } catch (error) {
    console.error('Integration test failed with error:', error);
  }
}

runTest();
