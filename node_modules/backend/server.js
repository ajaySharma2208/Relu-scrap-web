import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import config from './src/config/env.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception caught!');
  console.error(err.name, err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Listen to HTTP requests
  const server = app.listen(config.port, () => {
    console.log(`Server is running in [${config.nodeEnv}] mode on port: ${config.port}`);
  });

  // Handle Unhandled Promise Rejections
  process.on('unhandledRejection', (err) => {
    console.error('CRITICAL: Unhandled Promise Rejection caught!');
    console.error(err.name, err.message);
    if (err.stack) console.error(err.stack);
    
    // Close server and exit
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
