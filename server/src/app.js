import express from 'express';
import cors from 'cors';
import requestLogger from './middleware/requestLogger.js';
import responseFormatter from './middleware/responseFormatter.js';
import apiRouter from './routes/index.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { sqlSanitizer } from './middleware/sqlSanitizer.js';
import { ipBlocker } from './middleware/ipBlocker.js';

const app = express();

// Disable Express server fingerprinting
app.disable('x-powered-by');

// Trust reverse proxy (Render, Cloudflare, etc.) for correct client IP detection in rate limiting
app.set('trust proxy', 1);

// 1. CORS MUST BE THE VERY FIRST MIDDLEWARE
// This guarantees that ANY response (including 403 Forbidden, 429 Too Many Requests, and preflight OPTIONS)
// always carries Access-Control-Allow-Origin headers, preventing browser "Network Error" failures!
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors({ origin: true, credentials: true }));

// Strict HTTP security headers (Anti-Clickjacking, Anti-MIME sniffing, XSS Defense)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. IP Blocker & Defense (inspects after CORS is established)
app.use(ipBlocker);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiting & SQL Sanitizer
app.use(globalLimiter);
app.use(sqlSanitizer);

// 5. Custom core middleware
app.use(requestLogger);
app.use(responseFormatter);

// 6. Central routes registration versioned under /api/v1 and root fallback
app.use('/api/v1', apiRouter);
app.use('/', apiRouter);

// 7. Default root route
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to TransitOps API. Please use /api/v1/health for service health.'
  });
});

// 8. Catch-all for undefined routes
app.use(notFoundHandler);

// 9. Global centralized error handler
app.use(errorHandler);

export default app;
