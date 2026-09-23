import { Router } from 'express';
import { env } from '../config/env.js';
import { testConnection } from '../config/db.js';
import { emailService } from '../services/email.service.js';

const router = Router();

let pingCount = 0;
const serverStartTime = Date.now();

/**
 * @route GET /api/v1/health/ping
 * @desc Ultra-lightweight keep-alive ping endpoint (responds in <1ms without DB latency)
 */
router.get(['/health/ping', '/ping'], (req, res) => {
  pingCount += 1;
  return res.status(200).json({
    success: true,
    status: 'alive',
    message: 'TransitOps Backend Active',
    uptimeSeconds: Math.floor(process.uptime()),
    pingCount,
    serverStartTime: new Date(serverStartTime).toISOString(),
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/v1/health
 * @desc Get application health status and SMTP configuration diagnostic
 */
router.get('/health', async (req, res) => {
  const isDbConnected = await testConnection();
  const host = process.env.SMTP_HOST || '';
  const isConfigured = Boolean(host && host !== 'localhost' && host !== 'smtp.mailtrap.io');

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? 'TransitOps API & Database Healthy' : 'Database Connection Failed',
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    dbHost: env.db.host,
    smtp: {
      isConfigured,
      host: process.env.SMTP_HOST || 'NOT_CONFIGURED',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : 'NOT_CONFIGURED',
      hasPass: Boolean(process.env.SMTP_PASS),
      from: process.env.SMTP_FROM || 'NOT_CONFIGURED'
    },
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

/**
 * @route GET /api/v1/health/smtp-test
 * @desc Run live diagnostic test on SMTP connection and sending
 */
router.get('/health/smtp-test', async (req, res) => {
  const to = req.query.to || process.env.SMTP_FROM || 'pavanwinners639@gmail.com';
  const verifyResult = await emailService.verifySmtp();
  
  if (!verifyResult.ok) {
    return res.status(500).json({
      success: false,
      step: 'verify',
      diagnostic: verifyResult,
      hint: 'Check that SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are correctly set in Render environment variables.'
    });
  }

  const sendResult = await emailService.sendTestEmail(to);
  return res.status(sendResult.ok ? 200 : 500).json({
    success: sendResult.ok,
    step: 'send',
    diagnostic: sendResult,
    targetEmail: to
  });
});

export default router;
