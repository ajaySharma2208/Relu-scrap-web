// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load environment variables from backend root directory .env file
// dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// const config = {
//   port: parseInt(process.env.PORT || '5000', 10),
//   nodeEnv: process.env.NODE_ENV || 'development',
//   mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/company-enricher',
//   geminiApiKey: process.env.GEMINI_API_KEY || ''
// };

// // Validate critical variables
// if (!process.env.MONGODB_URI) {
//   console.warn('Warning: MONGODB_URI is not defined in environment variables. Defaulting to local instance.');
// }

// export default config;



import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const config = {
  // Render automatically provides PORT
  port: parseInt(process.env.PORT || '5000', 10),

  // development / production
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB connection string
  mongodbUri: process.env.MONGODB_URI,

  // Gemini API key
  geminiApiKey: process.env.GEMINI_API_KEY
};

// Validate required environment variables
const requiredEnvVariables = [
  'MONGODB_URI',
  'GEMINI_API_KEY'
];

const missingVariables = requiredEnvVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  console.error(
    `CRITICAL: Missing required environment variables: ${missingVariables.join(', ')}`
  );

  process.exit(1);
}

console.log(`Environment: ${config.nodeEnv}`);
console.log(`Port: ${config.port}`);

export default config;

