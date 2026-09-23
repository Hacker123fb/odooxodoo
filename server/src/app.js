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

// Strict HTTP security headers (Anti-Clickjacking, Anti-MIME sniffing, XSS Defense)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 1. IP Blocker & Defense (inspects before any route execution)
app.use(ipBlocker);

// 2. Standard third-party middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Security & Rate Limiting middleware
app.use(globalLimiter);
app.use(sqlSanitizer);

// 3. Custom core middleware
app.use(requestLogger);
app.use(responseFormatter);

// 3. Central routes registration versioned under /api/v1 and root fallback
app.use('/api/v1', apiRouter);
app.use('/', apiRouter);

// 4. Default root route
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to TransitOps API. Please use /api/v1/health for service health.'
  });
});

// 5. Catch-all for undefined routes
app.use(notFoundHandler);

// 6. Global centralized error handler
app.use(errorHandler);

export default app;
