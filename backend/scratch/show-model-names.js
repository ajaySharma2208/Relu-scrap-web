import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const list = await ai.models.list();
    // list is an array-like object or has a models field
    const modelsArray = list.models || list;
    console.log(`Total models found: ${modelsArray.length}`);
    
    // Filter models that support generateContent
    const genModels = modelsArray.filter(m => 
      m.supportedActions?.includes('generateContent') || 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log('\nSupported generation models:');
    genModels.forEach(m => {
      console.log(`- ${m.name} (DisplayName: ${m.displayName})`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
