import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { otpModel } from '../models/otp.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

// High-Speed In-Memory Fast Cache for sub-millisecond OTP verification
const otpFastMemoryCache = new Map();

// Periodic garbage collection for memory cache (removes entries older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpFastMemoryCache.entries()) {
    if (now > entry.expiresAtMs) {
      otpFastMemoryCache.delete(email);
    }
  }
}, 60 * 1000);

export const otpService = {
  /**
   * Generates a 6-digit numeric OTP and saves it to fast cache and DB
   */
  async generateOtp(email, registrationData, isResend = false) {
    const cached = otpFastMemoryCache.get(email);
    
    // Check resend throttling (60 seconds)
    if (isResend) {
      const now = Date.now();
      const lastCreated = cached ? cached.createdAtMs : null;
      if (lastCreated && (now - lastCreated) < 60 * 1000) {
        const remaining = Math.ceil((60 * 1000 - (now - lastCreated)) / 1000);
        throw new AppError(
          `Please wait ${remaining} seconds before requesting a new OTP.`,
          HttpStatusCodes.TOO_MANY_REQUESTS
        );
      }
    }

    // Generate cryptographically secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    const expiresAtMs = expiresAt.getTime();

    // Preserve registration payload if resend
    const finalRegData = registrationData || cached?.registrationData;
    if (!finalRegData) {
      const dbRecord = await otpModel.findByEmail(email);
      if (dbRecord) {
        try {
          finalRegData = JSON.parse(dbRecord.registration_data);
        } catch (e) {}
      }
    }

    if (!finalRegData) {
      throw new AppError('No registration details found. Please submit the registration form again.', HttpStatusCodes.BAD_REQUEST);
    }

    // 1. Immediately store in fast in-memory cache for zero-latency verification
    otpFastMemoryCache.set(email, {
      otp,
      expiresAtMs,
      attempts: 0,
      createdAtMs: Date.now(),
      registrationData: finalRegData
    });

    // 2. Persist to database asynchronously (non-blocking for ultra-fast API response)
    (async () => {
      try {
        const otpHash = await bcrypt.hash(otp, 8); // Fast 8 salt rounds for quick background persistence
        await otpModel.saveOtp({
          email,
          otpHash,
          expiresAt,
          registrationData: finalRegData
        });
      } catch (err) {
        console.warn(`[OTP] Async DB backup warning for ${email}:`, err.message);
      }
    })();

    return otp;
  },

  /**
   * Validates the submitted OTP with sub-millisecond memory speed
   */
  async verifyOtp(email, submittedOtp) {
    const cached = otpFastMemoryCache.get(email);

    // Fast Memory Path
    if (cached) {
      // Expiration check
      if (Date.now() > cached.expiresAtMs) {
        otpFastMemoryCache.delete(email);
        otpModel.delete(email).catch(() => {});
        throw new AppError('OTP expired. Please request a new registration OTP.', HttpStatusCodes.BAD_REQUEST);
      }

      // Max attempts check
      if (cached.attempts >= 5) {
        otpFastMemoryCache.delete(email);
        otpModel.delete(email).catch(() => {});
        throw new AppError('Maximum verification attempts exceeded. This OTP is locked. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
      }

      // Exact match check (constant-time comparison for security)
      const cleanSubmitted = String(submittedOtp).trim();
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(cleanSubmitted.padEnd(6, ' ')),
        Buffer.from(String(cached.otp).padEnd(6, ' '))
      );

      if (!isMatch) {
        cached.attempts += 1;
        const remaining = 5 - cached.attempts;
        if (remaining <= 0) {
          otpFastMemoryCache.delete(email);
          otpModel.delete(email).catch(() => {});
          throw new AppError('Maximum attempts exceeded. This OTP is locked. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
        }
        throw new AppError(`Wrong OTP. ${remaining} attempts remaining. Please check your code and try again.`, HttpStatusCodes.BAD_REQUEST);
      }

      // Success: clean up cache and DB
      const regData = cached.registrationData;
      otpFastMemoryCache.delete(email);
      otpModel.delete(email).catch(() => {});
      return regData;
    }

    // Database Fallback Path (if memory cache was reset)
    const record = await otpModel.findByEmail(email);
    if (!record) {
      throw new AppError('OTP expired or not found. Please request a new registration OTP.', HttpStatusCodes.BAD_REQUEST);
    }

    if (record.attempts >= 5) {
      throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
    }

    const isMatch = await bcrypt.compare(String(submittedOtp).trim(), record.otp_hash);
    if (!isMatch) {
      await otpModel.incrementAttempts(email);
      const remaining = 5 - (record.attempts + 1);
      if (remaining <= 0) {
        throw new AppError('Maximum attempts exceeded. This OTP is locked. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
      }
      throw new AppError(`Wrong OTP. ${remaining} attempts remaining. Please check your code and try again.`, HttpStatusCodes.BAD_REQUEST);
    }

    if (new Date(record.expires_at) < new Date()) {
      await otpModel.delete(email);
      throw new AppError('OTP expired. Please request a new registration OTP.', HttpStatusCodes.BAD_REQUEST);
    }

    await otpModel.delete(email);
    return JSON.parse(record.registration_data);
  }
};

export default otpService;
