// import express from 'express';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import cors from 'cors';
// import compression from 'compression';
// import routes from './routes/index.js';
// import { apiLimiter } from './middleware/rateLimiter.js';
// import { errorHandler } from './middleware/errorHandler.js';
// import config from './config/env.js';

// const app = express();

// // 1. Configure Helmet for security headers
// app.use(helmet());

// // 2. Configure Morgan HTTP request logger
// if (config.nodeEnv === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// // 3. Configure Compression for payload optimization
// app.use(compression());

// // 4. Configure CORS
// app.use(cors({
//   origin: '*', // Open for hackathon dev. Narrow in real production.
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // 5. Body Parsers
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // 6. Configure Rate Limiter
// app.use(apiLimiter);

// // 7. Bind Application Routes (exposing versioned endpoints like /api/v1)
// app.use('/', routes);

// // 8. 404 Route Handler
// app.use((req, res, next) => {
//   const err = new Error(`Route not found - ${req.originalUrl}`);
//   err.statusCode = 404;
//   next(err);
// });

// // 9. Global Centralized Error Handler
// app.use(errorHandler);

// export default app;



import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';

import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/env.js';

const app = express();

// 1. Configure Helmet for security headers
app.use(helmet());

// 2. Configure Morgan HTTP request logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. Configure Compression for payload optimization
app.use(compression());

// 4. Configure CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 5. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Configure Rate Limiter
app.use(apiLimiter);

// 7. Bind Application Routes
app.use('/', routes);

// 8. 404 Route Handler
app.use((req, res, next) => {
  const err = new Error(`Route not found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// 9. Global Centralized Error Handler
app.use(errorHandler);

export default app;

