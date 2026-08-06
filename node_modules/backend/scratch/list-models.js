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
    const names = list.map(m => m.name);
    console.log('Available Model Names:', names);
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

run();
