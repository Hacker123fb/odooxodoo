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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const emailService = {
  /**
   * Sends the 6-digit numeric OTP to the user's email address for Registration
   */
  async sendOtpEmail(email, otp) {
    await autoConfigureSmtp();

    try {
      const transporter = getTransporter();
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@transitops.com';

      const info = await transporter.sendMail({
        from: `"TransitOps Notifications" <${fromAddress}>`,
        to: email,
        subject: 'TransitOps - User Registration Verification Code',
        text: `Welcome to TransitOps! Your registration verification code is: ${otp}. This code is valid for 3 minutes.`,
        html: `
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
        `
      });

      console.log(`[EMAIL] Registration OTP successfully dispatched to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EMAIL] Test inbox preview URL: ${previewUrl}`);
      }
    } catch (smtpErr) {
      console.warn(`[EMAIL] SMTP delivery failed: ${smtpErr.message}. Fallback to server debug file.`);
      try {
        const otpPath = path.resolve(__dirname, '../../otp-debug.txt');
        const content = `Timestamp: ${new Date().toISOString()}\nType: REGISTRATION\nEmail: ${email}\nOTP: ${otp}\n`;
        fs.appendFileSync(otpPath, content, 'utf8');
        console.log(`[EMAIL] OTP backup written to: server/otp-debug.txt`);
      } catch (fsErr) {
        console.error('[EMAIL] Failed to write backup OTP debug file:', fsErr.message);
      }
    }
  },

  /**
   * Sends the 6-digit numeric OTP to the user's email address for Password Reset
   */
  async sendPasswordResetEmail(email, otp) {
    await autoConfigureSmtp();

    try {
      const transporter = getTransporter();
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@transitops.com';

      const info = await transporter.sendMail({
        from: `"TransitOps Security" <${fromAddress}>`,
        to: email,
        subject: 'TransitOps - Password Reset Request Code',
        text: `You have requested to reset your TransitOps password. Your verification code is: ${otp}. This code is valid for 10 minutes.`,
        html: `
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
        `
      });

      console.log(`[EMAIL] Password reset OTP successfully dispatched to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EMAIL] Test inbox preview URL: ${previewUrl}`);
      }
    } catch (smtpErr) {
      console.warn(`[EMAIL] SMTP delivery failed: ${smtpErr.message}. Fallback to server debug file.`);
      try {
        const otpPath = path.resolve(__dirname, '../../otp-debug.txt');
        const content = `Timestamp: ${new Date().toISOString()}\nType: PASSWORD_RESET\nEmail: ${email}\nOTP: ${otp}\n`;
        fs.appendFileSync(otpPath, content, 'utf8');
        console.log(`[EMAIL] OTP backup written to: server/otp-debug.txt`);
      } catch (fsErr) {
        console.error('[EMAIL] Failed to write backup OTP debug file:', fsErr.message);
      }
    }
  }
};

export default emailService;
