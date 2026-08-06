import { ai } from '../src/config/gemini.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
  try {
    const list = await ai.models.list();
    console.log('Returned object structure:', Object.keys(list));
    console.log('Raw list response keys:', Object.keys(list.page || {}));
    console.log('List count:', list.page?.length || list.length);
    // Let's print out the names if they are in the result page array
    const modelsArray = list.page || [];
    modelsArray.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error('Failed to list models:', err.message);
  }
}

listModels();
