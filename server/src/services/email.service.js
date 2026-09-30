import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

/**
 * Automates creation of SMTP test configurations when no credentials are provided
 */
const autoConfigureSmtp = async () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;

  const isDefaultOrEmpty = !host || 
                           host === 'smtp.mailtrap.io' || 
                           !user || 
                           user === 'your_smtp_username';

  if (!isDefaultOrEmpty) {
    return; // Already configured with user credentials
  }

  // Only attempt ethereal creation in local development if no credentials set
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log('[EMAIL] SMTP not configured. Creating automated Ethereal Mail account...');
  try {
    const account = await nodemailer.createTestAccount();
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const smtpConfig = {
      SMTP_HOST: 'smtp.ethereal.email',
      SMTP_PORT: '587',
      SMTP_USER: account.user,
      SMTP_PASS: account.pass,
      SMTP_FROM: 'no-reply@transitops.com'
    };

    let updatedEnv = envContent;
    Object.entries(smtpConfig).forEach(([key, val]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(updatedEnv)) {
        updatedEnv = updatedEnv.replace(regex, `${key}=${val}`);
      } else {
        updatedEnv += `\n${key}=${val}`;
      }
      process.env[key] = val;
    });

    try {
      fs.writeFileSync(envPath, updatedEnv, 'utf8');
    } catch (e) {
      // Ignore write errors in read-only/cloud environments
    }

    console.log('[EMAIL] Ethereal SMTP test account initialized.');
    console.log(`[EMAIL] Preview/verify inboxes at: https://ethereal.email`);
  } catch (err) {
    console.warn('[EMAIL] Automatic test account creation failed:', err.message);
  }
};

/**
 * Creates and returns a configured Nodemailer transporter
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const isGmail = host === 'smtp.gmail.com' || (user && user.endsWith('@gmail.com'));

  if (isGmail && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      }
    });
  }

  return nodemailer.createTransport({
    host: host || 'localhost',
    port: port,
    secure: port === 465,
    auth: user ? {
      user: user,
      pass: pass || ''
    } : undefined,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendWithTimeout = (transporter, mailOptions, timeoutMs = 5000) => {
  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP connection timed out after ${timeoutMs / 1000}s`)), timeoutMs)
    )
  ]);
};

/**
 * Dispatches email using Brevo REST API v3 over standard HTTPS (Port 443).
 * This completely avoids cloud container SMTP port blocks (Render blocks 25, 465, 587 on free tier).
 */
const sendViaBrevoHttpApi = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'pavanwinners80@gmail.com';

  if (!apiKey) {
    throw new Error('No API key found in BREVO_API_KEY or SMTP_PASS.');
  }

  const payload = {
    sender: {
      name: 'TransitOps Notifications',
      email: fromEmail
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
    textContent: text
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Brevo HTTP API error: ${response.status}`);
  }
  return data;
};

/**
 * Unified email dispatcher with Brevo HTTP API (Port 443 HTTPS), SMTP fallback, and debug file fallback
 */
const dispatchEmail = async ({ to, subject, html, text, type = 'NOTIFICATION' }) => {
  // 1. First attempt: Brevo HTTP API (Port 443 HTTPS - never blocked by cloud firewalls)
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  if (apiKey && (process.env.BREVO_API_KEY || process.env.SMTP_HOST?.includes('brevo'))) {
    try {
      const brevoResult = await sendViaBrevoHttpApi({
        to,
        subject,
        html,
        text
      });
      console.log(`[EMAIL] ${type} successfully dispatched via Brevo HTTP API to ${to}. MessageId:`, brevoResult.messageId);
      return brevoResult;
    } catch (brevoErr) {
      console.warn(`[EMAIL] Brevo HTTP API attempt failed for ${type}: ${brevoErr.message}. Attempting SMTP fallback...`);
    }
  }

  // 2. Second attempt: Standard SMTP Transport
  await autoConfigureSmtp();
  const host = process.env.SMTP_HOST;

  if (!host || host === 'localhost') {
    console.log(`[EMAIL] No external SMTP host configured. ${type} for ${to}: ${subject}`);
    try {
      const otpPath = path.resolve(__dirname, '../../otp-debug.txt');
      const content = `Timestamp: ${new Date().toISOString()}\nType: ${type}\nEmail: ${to}\nSubject: ${subject}\nText: ${text}\n`;
      fs.appendFileSync(otpPath, content, 'utf8');
    } catch (e) {}
    return;
  }

  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@transitops.com';

    const info = await sendWithTimeout(transporter, {
      from: `"TransitOps Notifications" <${fromAddress}>`,
      to,
      subject,
      text,
      html
    }, 5000);

    console.log(`[EMAIL] ${type} successfully dispatched via SMTP to ${to}`);
    return info;
  } catch (smtpErr) {
    console.warn(`[EMAIL] SMTP delivery failed for ${type}: ${smtpErr.message}. Fallback to server debug file.`);
    try {
      const otpPath = path.resolve(__dirname, '../../otp-debug.txt');
      const content = `Timestamp: ${new Date().toISOString()}\nType: ${type}\nEmail: ${to}\nSubject: ${subject}\nText: ${text}\n`;
      fs.appendFileSync(otpPath, content, 'utf8');
      console.log(`[EMAIL] ${type} backup written to: server/otp-debug.txt`);
    } catch (fsErr) {
      console.error('[EMAIL] Failed to write backup email debug file:', fsErr.message);
    }
  }
};

export const emailService = {
  /**
   * Sends the 6-digit numeric OTP to the user's email address for Registration
   */
  async sendOtpEmail(email, otp) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #edf2f7; padding-bottom: 16px;">
          <h2 style="color: #2b6cb0; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Transit<span style="color: #4a5568;">Ops</span></h2>
          <p style="color: #718096; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Logistics &amp; Fleet Intelligence</p>
        </div>
        <h3 style="color: #2d3748; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Verify Your Email</h3>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for signing up for TransitOps. Please use the 6-digit verification code below to activate your account:
        </p>
        <div style="text-align: center; background-color: #f7fafc; border: 1px dashed #cbd5e0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px;">${otp}</span>
          <p style="color: #a0aec0; font-size: 11px; margin-top: 8px; margin-bottom: 0;">Code expires in 3 minutes</p>
        </div>
        <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If you did not request this code, you can safely ignore this email.
        </p>
        <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; font-size: 10px; color: #a0aec0;">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>
    `;
    const textBody = `Welcome to TransitOps! Your registration verification code is: ${otp}. This code is valid for 3 minutes.`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - User Registration Verification Code',
      html: htmlBody,
      text: textBody,
      type: 'REGISTRATION_OTP'
    });
  },

  /**
   * Sends the 6-digit numeric OTP to the user's email address for Password Reset
   */
  async sendPasswordResetEmail(email, otp) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #edf2f7; padding-bottom: 16px;">
          <h2 style="color: #2b6cb0; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Transit<span style="color: #4a5568;">Ops</span></h2>
          <p style="color: #718096; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Logistics &amp; Fleet Intelligence</p>
        </div>
        <h3 style="color: #2d3748; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h3>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset the password for your TransitOps account. Use the 6-digit verification code below to proceed:
        </p>
        <div style="text-align: center; background-color: #f7fafc; border: 1px dashed #cbd5e0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #e53e3e; letter-spacing: 4px;">${otp}</span>
          <p style="color: #a0aec0; font-size: 11px; margin-top: 8px; margin-bottom: 0;">Code expires in 10 minutes</p>
        </div>
        <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If you did not request a password reset, please ignore this message or ensure your account is secure.
        </p>
        <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; font-size: 10px; color: #a0aec0;">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>
    `;
    const textBody = `You have requested to reset your TransitOps password. Your verification code is: ${otp}. This code is valid for 10 minutes.`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - Password Reset Request Code',
      html: htmlBody,
      text: textBody,
      type: 'PASSWORD_RESET_OTP'
    });
  },

  /**
   * Sends an account approval notification email with portal login link
   */
  async sendApprovalEmail(email, fullName, roleName) {
    const formattedRole = (roleName || '').replace(/_/g, ' ');
    const clientUrl = process.env.CLIENT_URL || 'https://transitops-lemon-seven.vercel.app';
    const loginUrl = `${clientUrl.replace(/\/+$/, '')}/login`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #edf2f7; padding-bottom: 16px;">
          <h2 style="color: #2b6cb0; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Transit<span style="color: #4a5568;">Ops</span></h2>
          <p style="color: #718096; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Logistics &amp; Fleet Intelligence</p>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: #def7ec; border: 1px solid #bcf0da; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; color: #046c4e;">
            ✓
          </div>
        </div>
        <h3 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 12px; text-align: center;">Account Registration Approved</h3>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Your registration request for the role of <strong style="color: #2b6cb0;">${formattedRole}</strong> has been reviewed and authorized by platform administration.
        </p>
        <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #4a5568;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 40%;">Account Email:</td>
              <td style="padding: 4px 0; font-family: monospace;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Authorized Role:</td>
              <td style="padding: 4px 0;">${formattedRole}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Account Status:</td>
              <td style="padding: 4px 0; color: #046c4e; font-weight: bold;">ACTIVE</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${loginUrl}" style="background-color: #1a202c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block;">
            Sign In to TransitOps
          </a>
        </div>
        <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0; text-align: center;">
          Portal Link: <a href="${loginUrl}" style="color: #2b6cb0;">${loginUrl}</a>
        </p>
        <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; font-size: 10px; color: #a0aec0;">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>
    `;
    const textBody = `Hello ${fullName},\n\nYour TransitOps registration for the role of ${formattedRole} has been approved by administration. You may now sign in at: ${loginUrl}\n\nAccount: ${email}`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - Account Registration Approved',
      html: htmlBody,
      text: textBody,
      type: 'ACCOUNT_APPROVED'
    });
  },

  /**
   * Sends an account rejection notification email
   */
  async sendRejectionEmail(email, fullName, roleName) {
    const formattedRole = (roleName || '').replace(/_/g, ' ');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #edf2f7; padding-bottom: 16px;">
          <h2 style="color: #2b6cb0; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Transit<span style="color: #4a5568;">Ops</span></h2>
          <p style="color: #718096; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Logistics &amp; Fleet Intelligence</p>
        </div>
        <h3 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 12px; text-align: center;">Registration Request Update</h3>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for your interest in joining TransitOps. Following administrative security review, your registration request for the role of <strong style="color: #e53e3e;">${formattedRole}</strong> was not approved at this time.
        </p>
        <div style="background-color: #fdf2f2; border: 1px solid #fbd5d5; border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #9b1c1c; font-size: 13px;">
          If you believe this decision was made in error or you require operational access, please reach out directly to your organization Super Admin or Fleet Manager.
        </div>
        <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; font-size: 10px; color: #a0aec0;">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>
    `;
    const textBody = `Hello ${fullName},\n\nYour TransitOps registration request for the role of ${formattedRole} was not approved at this time. If you believe this is an error, please contact your organization administrator.`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - Registration Request Status',
      html: htmlBody,
      text: textBody,
      type: 'ACCOUNT_REJECTED'
    });
  },

  /**
   * Diagnostic method to test SMTP or Brevo HTTP connectivity and credentials
   */
  async verifySmtp() {
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;

    // Check Brevo HTTP API account connectivity
    if (apiKey && (process.env.BREVO_API_KEY || process.env.SMTP_HOST?.includes('brevo'))) {
      try {
        const r = await fetch('https://api.brevo.com/v3/account', {
          headers: { 'api-key': apiKey, 'accept': 'application/json' }
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok) {
          return { ok: true, mode: 'BREVO_HTTP_API', email: data.email, plan: data.plan?.[0]?.type || 'active' };
        } else {
          return {
            ok: false,
            mode: 'BREVO_HTTP_API',
            error: data.message || `HTTP ${r.status}`,
            code: data.code,
            hint: 'If you are using an SMTP key (xsmtpsib-...), please create an API key (xkeysib-...) from Brevo Dashboard -> SMTP & API -> API Keys and set it as BREVO_API_KEY in Render.'
          };
        }
      } catch (err) {
        return { ok: false, mode: 'BREVO_HTTP_API', error: err.message };
      }
    }

    await autoConfigureSmtp();
    const host = process.env.SMTP_HOST;
    if (!host || host === 'localhost') {
      return { ok: false, error: 'SMTP_HOST is not configured in environment variables.' };
    }
    try {
      const transporter = getTransporter();
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP verify timed out after 6s (Render blocks SMTP ports 25/465/587 on free tier; use Brevo HTTP API instead)')), 6000))
      ]);
      return { ok: true, mode: 'SMTP', message: 'SMTP credentials verified successfully.' };
    } catch (err) {
      return { ok: false, mode: 'SMTP', error: err.message, code: err.code };
    }
  },

  /**
   * Diagnostic method to test actual email delivery
   */
  async sendTestEmail(toEmail) {
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;

    if (apiKey && (process.env.BREVO_API_KEY || process.env.SMTP_HOST?.includes('brevo'))) {
      try {
        const result = await sendViaBrevoHttpApi({
          to: toEmail,
          subject: 'TransitOps - Email Diagnostic Test',
          html: '<p>Hello from TransitOps! Your email service is successfully configured and working via Brevo HTTP API.</p>',
          text: 'Hello from TransitOps! Your email service is successfully configured.'
        });
        return { ok: true, mode: 'BREVO_HTTP_API', message: 'Test email successfully sent!', messageId: result.messageId };
      } catch (err) {
        return { ok: false, mode: 'BREVO_HTTP_API', error: err.message };
      }
    }

    await autoConfigureSmtp();
    const host = process.env.SMTP_HOST;
    if (!host || host === 'localhost') {
      return { ok: false, error: 'SMTP_HOST is not configured in environment variables.' };
    }
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@transitops.com';
    try {
      const info = await sendWithTimeout(transporter, {
        from: `"TransitOps Test" <${fromAddress}>`,
        to: toEmail,
        subject: 'TransitOps - SMTP Test Diagnostic',
        text: 'Hello! This is a test email from TransitOps to verify that SMTP delivery is functional.'
      }, 8000);
      return { ok: true, mode: 'SMTP', message: 'Test email successfully sent!', messageId: info.messageId };
    } catch (err) {
      return { ok: false, mode: 'SMTP', error: err.message, code: err.code };
    }
  }
};

export default emailService;
