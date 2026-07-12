import express from 'express';
import cors from 'cors';
import requestLogger from './middleware/requestLogger.js';
import responseFormatter from './middleware/responseFormatter.js';
import apiRouter from './routes/index.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// 1. Standard third-party middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Custom core middleware
app.use(requestLogger);
app.use(responseFormatter);

// 3. Central routes registration versioned under /api/v1
app.use('/api/v1', apiRouter);

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
