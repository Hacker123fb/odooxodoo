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
    console.warn(`[EMAIL] SMTP delivery failed for ${type} to ${to}: ${smtpErr.message}`);
  }
};

export const emailService = {
  /**
   * Sends the 6-digit numeric OTP to the user's email address for Registration
   */
  async sendOtpEmail(email, otp) {
    const formattedDate = new Date().toUTCString();
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TransitOps Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 28px 36px; border-bottom: 3px solid #2563eb;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                            Transit<span style="color: #38bdf8;">Ops</span>
                          </div>
                          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 3px; font-weight: 600;">
                            Enterprise Fleet Intelligence
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px;">
                            Security Verified
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 36px 28px 36px;">
                    <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.3px;">
                      Verify Your Email Address
                    </h1>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Thank you for creating an account with <strong>TransitOps</strong>. To activate your operational profile and proceed with registration verification, please enter the one-time passcode below:
                    </p>

                    <!-- High-Impact OTP Display Card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 26px 0;">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 14px; padding: 26px 20px; border: 1px solid #334155;">
                          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px;">
                            One-Time Verification Passcode
                          </div>
                          <div style="font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; color: #ffffff; letter-spacing: 10px; padding-left: 10px; line-height: 1;">
                            ${otp}
                          </div>
                          <div style="margin-top: 16px;">
                            <span style="display: inline-block; background-color: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); color: #fde047; font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px;">
                              ⏱ Valid for 3 minutes only
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert Advisory -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                      <div style="font-weight: 700; font-size: 12px; color: #1e293b; margin-bottom: 4px;">
                        🛡️ Important Security Protocol
                      </div>
                      <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                        Never share this 6-digit code with anyone. TransitOps platform administrators will never ask for your verification passcode by phone, SMS, or email.
                      </div>
                    </div>

                    <!-- Request Metadata -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600; width: 35%;">Account:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0; font-family: monospace;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600;">Purpose:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0;">New Account Registration</td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600;">Issued At:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0;">${formattedDate}</td>
                      </tr>
                    </table>

                    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
                      If you did not initiate this request, you can safely disregard this email. Your email address will not be registered without code verification.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 6px;">
                      This is an automated security dispatch. Please do not reply directly to this email.
                    </div>
                    <div style="font-size: 10px; color: #94a3b8;">
                      © 2026 TransitOps Fleet Operations System. All rights reserved.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const textBody = `TransitOps Security Verification Code: ${otp}\n\nUse this 6-digit code to complete your registration. This code expires in 3 minutes.\n\nAccount: ${email}\nSecurity Tip: Never share this code with anyone.\n\n© 2026 TransitOps`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - Registration Verification Code',
      html: htmlBody,
      text: textBody,
      type: 'REGISTRATION_OTP'
    });
  },

  /**
   * Sends the 6-digit numeric OTP to the user's email address for Password Reset
   */
  async sendPasswordResetEmail(email, otp) {
    const formattedDate = new Date().toUTCString();
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TransitOps Password Reset Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 28px 36px; border-bottom: 3px solid #dc2626;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                            Transit<span style="color: #f87171;">Ops</span>
                          </div>
                          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 3px; font-weight: 600;">
                            Account Security Service
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px;">
                            Password Reset
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 36px 28px 36px;">
                    <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.3px;">
                      Password Reset Request
                    </h1>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      We received an authorization request to reset the password for your <strong>TransitOps</strong> account. Please use the 6-digit recovery code below to proceed:
                    </p>

                    <!-- High-Impact OTP Display Card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 26px 0;">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 14px; padding: 26px 20px; border: 1px solid #334155;">
                          <div style="color: #fca5a5; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px;">
                            Password Recovery Passcode
                          </div>
                          <div style="font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; color: #ffffff; letter-spacing: 10px; padding-left: 10px; line-height: 1;">
                            ${otp}
                          </div>
                          <div style="margin-top: 16px;">
                            <span style="display: inline-block; background-color: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); color: #fde047; font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px;">
                              ⏱ Code expires in 10 minutes
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert Advisory -->
                    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                      <div style="font-weight: 700; font-size: 12px; color: #991b1b; margin-bottom: 4px;">
                        ⚠️ Security Alert
                      </div>
                      <div style="font-size: 12px; color: #b91c1c; line-height: 1.5;">
                        If you did not request this password reset, please contact your organization Super Admin immediately. Your existing password remains secure until reset.
                      </div>
                    </div>

                    <!-- Request Metadata -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600; width: 35%;">Account:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0; font-family: monospace;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600;">Purpose:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0;">Account Recovery</td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; color: #64748b; padding: 3px 0; font-weight: 600;">Issued At:</td>
                        <td style="font-size: 11px; color: #0f172a; padding: 3px 0;">${formattedDate}</td>
                      </tr>
                    </table>

                    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
                      For your protection, never forward or disclose this passcode to any individual.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 6px;">
                      This is an automated security dispatch. Please do not reply directly to this email.
                    </div>
                    <div style="font-size: 10px; color: #94a3b8;">
                      © 2026 TransitOps Fleet Operations System. All rights reserved.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const textBody = `TransitOps Password Reset Code: ${otp}\n\nUse this 6-digit code to reset your account password. This code expires in 10 minutes.\n\nAccount: ${email}\nSecurity Alert: If you did not request this reset, your account may be at risk. Contact your administrator.\n\n© 2026 TransitOps`;

    return dispatchEmail({
      to: email,
      subject: 'TransitOps - Password Reset Verification Code',
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
