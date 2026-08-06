import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No API key found in .env!');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: 'Tell me a 1-word greeting.'
    });
    console.log(`[SUCCESS] ${modelName} returned: ${res.text.trim()}`);
    return true;
  } catch (err) {
    console.log(`[FAILED] ${modelName} error: ${err.message}`);
    return false;
  }
}

async function run() {
  const models = [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.5-flash-lite',
    'models/gemini-3.1-flash-lite',
    'models/gemini-flash-lite-latest'
  ];

  for (const m of models) {
    await testModel(m);
    console.log('------------------------------------');
  }
}

run();
