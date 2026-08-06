import { GoogleGenAI } from '@google/genai';
import config from './env.js';

const apiKey = config.geminiApiKey;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables. Please add it to your backend/.env file.');
}

// Initialize the Google Gen AI client
export const ai = new GoogleGenAI({ apiKey: apiKey || '' });
