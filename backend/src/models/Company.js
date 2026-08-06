import { Schema, model } from 'mongoose';

const CompanySchema = new Schema({
  websiteName: { type: String, required: true },
  websiteUrl: { type: String, required: true, unique: true },
  companyName: { type: String, default: "" },
  address: { type: String, default: "" },
  phoneNumber: { type: String, default: "" },
  emails: { type: [String], default: [] },
  coreService: { type: String, default: "" },
  targetCustomer: { type: String, default: "" },
  probablePainPoint: { type: String, default: "" },
  outreachOpener: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const Company = model('Company', CompanySchema);
