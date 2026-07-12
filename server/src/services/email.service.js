import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

/**
 * Automates creation of SMTP test configurations and persists them in the server's .env file
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

  console.log('[EMAIL] SMTP not configured. Creating automated Ethereal Mail account...');
  try {
    const account = await nodemailer.createTestAccount();
    
    // Read existing .env content
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

    // Update variables dynamically in .env file and active runtime
    let updatedEnv = envContent;
    Object.entries(smtpConfig).forEach(([key, val]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(updatedEnv)) {
        updatedEnv = updatedEnv.replace(regex, `${key}=${val}`);
      } else {
        updatedEnv += `\n${key}=${val}`;
      }
      process.env[key] = val; // Apply to running server state
    });

    fs.writeFileSync(envPath, updatedEnv, 'utf8');
    console.log('[EMAIL] Ethereal SMTP credentials generated and written to server/.env');
    console.log(`[EMAIL] Host: smtp.ethereal.email`);
    console.log(`[EMAIL] User: ${account.user}`);
    console.log(`[EMAIL] Password: ${account.pass}`);
    console.log(`[EMAIL] Check your inbox by logging in at: https://ethereal.email`);
  } catch (err) {
    console.warn('[EMAIL] Automatic Ethereal account creation failed:', err.message);
  }
};

export const emailService = {
  /**
   * Sends the 6-digit numeric OTP to the user's email address
   */
  async sendOtpEmail(email, otp) {
    // Run automated SMTP configuration check before routing
    await autoConfigureSmtp();

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    try {
      const transporter = nodemailer.createTransport({
        host: host || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
        auth: user ? {
          user: user,
          pass: pass || ''
        } : undefined
      });

      const fromAddress = process.env.SMTP_FROM || 'no-reply@transitops.com';
      const info = await transporter.sendMail({
        from: `"TransitOps Notifications" <${fromAddress}>`,
        to: email,
        subject: 'TransitOps - User Registration OTP Verification',
        text: `Welcome to TransitOps! Your registration verification code is: ${otp}. This code is valid for 3 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #edf2f7; padding-bottom: 16px;">
              <h2 style="color: #2b6cb0; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Transit<span style="color: #4a5568;">Ops</span></h2>
              <p style="color: #718096; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Logistics &amp; Fleet Intelligence</p>
            </div>
            
            <h3 style="color: #2d3748; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Verify Your Identity</h3>
            <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Thank you for registering with TransitOps. To complete your operational roster user activation, please supply the 6-digit verification code below:
            </p>
            
            <div style="text-align: center; background-color: #f7fafc; border: 1px dashed #cbd5e0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px;">${otp}</span>
              <p style="color: #a0aec0; font-size: 11px; margin-top: 8px; margin-bottom: 0;">Code expires in 3 minutes</p>
            </div>
            
            <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
              If you did not initiate this request, please ignore this email or contact support if you suspect unauthorized access.
            </p>
            
            <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; font-size: 10px; color: #a0aec0;">
              © 2026 TransitOps. All rights reserved.
            </div>
          </div>
        `
      });

      // Print ethereal message preview link if sent using ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EMAIL] OTP sent to Ethereal test inbox.`);
        console.log(`[EMAIL] Preview/Verify mail inbox here: ${previewUrl}`);
      }
      
    } catch (smtpErr) {
      console.warn(`[EMAIL] SMTP delivery failed: ${smtpErr.message}. Fallback to server debug file.`);
      
      // Secondary Fallback: Write OTP locally to server/otp-debug.txt if SMTP is entirely unreachable
      try {
        const otpPath = path.resolve(__dirname, '../../otp-debug.txt');
        const content = `Timestamp: ${new Date().toISOString()}\nEmail: ${email}\nOTP: ${otp}\n`;
        fs.writeFileSync(otpPath, content, 'utf8');
        console.log(`[EMAIL] OTP backup written to: server/otp-debug.txt`);
      } catch (fsErr) {
        console.error('[EMAIL] Failed to write backup OTP debug file:', fsErr.message);
      }
    }
  }
};

export default emailService;
