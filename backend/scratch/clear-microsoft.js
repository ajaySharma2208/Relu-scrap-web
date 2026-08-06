import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/company-enricher';

const companySchema = new mongoose.Schema({
  websiteUrl: String
});
const Company = mongoose.model('Company', companySchema);

async function clearDb() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const res = await Company.deleteMany({
    $or: [
      { websiteUrl: /microsoft/i },
      { companyName: /microsoft/i },
      { websiteName: /microsoft/i }
    ]
  });

  console.log(`Deleted ${res.deletedCount} Microsoft records from database.`);
  await mongoose.disconnect();
  console.log('Disconnected.');
}

clearDb().catch(console.error);
