import mongoose from 'mongoose';
import config from './env.js';

/**
 * Connects to MongoDB database using config variables.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Helper to check connection status of mongoose.
 * Returns true if connected (readyState === 1).
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Monitor mongoose state changes
mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error occurred: ${err}`);
});
