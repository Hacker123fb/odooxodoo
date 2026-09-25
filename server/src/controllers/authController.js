import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { otpService } from '../services/otp.service.js';
import { emailService } from '../services/email.service.js';
import { passwordResetOtpModel } from '../models/passwordResetOtp.model.js';
import pool from '../config/db.js';
import { recordFailedLogin, recordSuccessfulLogin, recordFailedOtp } from '../middleware/ipBlocker.js';

// Fast memory cache for password reset OTPs to achieve sub-millisecond response
const passwordResetMemoryCache = new Map();

// Generate JWT Token
const signToken = (userId, roleName) => {
  return jwt.sign(
    { id: userId, role: roleName },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

/**
 * Authentication Controller with Ultra-Fast OTP Verification and Brute Force Defense
 */
export const authController = {
  /**
   * Register User (Phase 1: Validate details and send OTP)
   */
  register: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, roleName, employeeCode } = req.body;

      // 1. Parallelize uniqueness and role checks to eliminate cloud DB round-trip latency
      const [
        userExists,
        [userPhoneExists],
        [driverPhoneExists],
        [employeeCodeExists],
        roleRecord
      ] = await Promise.all([
        userModel.findByEmail(email),
        pool.query('SELECT id FROM users WHERE phone = ?', [phone]),
        pool.query('SELECT id FROM drivers WHERE phone = ?', [phone]),
        pool.query('SELECT id FROM drivers WHERE employee_id = ?', [employeeCode]),
        userModel.getRoleByName(roleName)
      ]);

      if (userExists) {
        throw new AppError('Email already registered.', HttpStatusCodes.CONFLICT);
      }
      if (userPhoneExists.length > 0 || driverPhoneExists.length > 0) {
        throw new AppError('Mobile number already registered.', HttpStatusCodes.CONFLICT);
      }
      if (employeeCodeExists.length > 0) {
        throw new AppError('Employee Code already exists.', HttpStatusCodes.CONFLICT);
      }
      if (!roleRecord) {
        throw new AppError(`The role '${roleName}' is invalid.`, HttpStatusCodes.BAD_REQUEST);
      }

      // Hash password with 10 salt rounds
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate secure OTP in fast memory cache
      const otp = await otpService.generateOtp(email, {
        fullName,
        employeeCode,
        email,
        phone,
        password: hashedPassword,
        roleName
      });

      console.log(`[AUTH] Registration OTP generated for ${email}`);

      // Dispatch OTP email in background (non-blocking, zero latency impact)
      emailService.sendOtpEmail(email, otp).catch(err => {
        console.error(`[EMAIL] Background registration OTP error for ${email}:`, err.message);
      });

      return res.ok(
        { email },
        'OTP sent successfully. Please check your registered email inbox.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify OTP (Phase 2: Fast creation of user record)
   */
  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      // 1. Verify OTP code (ultra-fast from memory cache)
      const regData = await otpService.verifyOtp(email, otp);

      // 2. Parallelize integrity checks before insertion
      const [userExists, [userPhoneExists], roleRecord] = await Promise.all([
        userModel.findByEmail(email),
        pool.query('SELECT id FROM users WHERE phone = ?', [regData.phone]),
        userModel.getRoleByName(regData.roleName)
      ]);

      if (userExists) {
        throw new AppError('Email already registered.', HttpStatusCodes.CONFLICT);
      }
      if (userPhoneExists.length > 0) {
        throw new AppError('Mobile number already registered.', HttpStatusCodes.CONFLICT);
      }
      if (!roleRecord) {
        throw new AppError('Invalid role specified.', HttpStatusCodes.BAD_REQUEST);
      }

      // 3. Provision user account
      const userId = await userModel.create({
        roleId: roleRecord.id,
        fullName: regData.fullName,
        email: regData.email,
        passwordHash: regData.password,
        phone: regData.phone
      });

      // Clear any previous failed attempts
      recordSuccessfulLogin(req.ip);

      return res.ok(
        {
          user: {
            id: userId,
            name: regData.fullName,
            email: regData.email,
            role: regData.roleName
          }
        },
        'Registration completed successfully.'
      );
    } catch (error) {
      if (error.statusCode === HttpStatusCodes.BAD_REQUEST || error.statusCode === HttpStatusCodes.FORBIDDEN) {
        recordFailedOtp(req.ip);
      }
      next(error);
    }
  },

  /**
   * Resend Registration OTP
   */
  resendOtp: async (req, res, next) => {
    try {
      const { email } = req.body;
      const otp = await otpService.generateOtp(email, null, true);

      console.log(`[AUTH] Resent OTP generated for ${email}`);

      // Dispatch non-blocking
      emailService.sendOtpEmail(email, otp).catch(err => {
        console.error(`[EMAIL] Background resend OTP error for ${email}:`, err.message);
      });

      return res.ok(
        null,
        'A fresh OTP verification code has been dispatched to your email address.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login User
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await userModel.findByEmail(email);

      if (!user) {
        recordFailedLogin(req.ip);
        return next(
          new AppError(
            'No account found with this email address.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      if (user.status !== 'ACTIVE') {
        return next(
          new AppError(
            `Your account is currently ${user.status}. Please contact support.`,
            HttpStatusCodes.FORBIDDEN
          )
        );
      }

      const passwordMatched = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatched) {
        recordFailedLogin(req.ip);
        return next(
          new AppError(
            'Wrong password. Please check your password and try again.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      // Update last login in background
      userModel.updateLastLogin(user.id).catch(() => {});

      const token = signToken(user.id, user.role_name);
      recordSuccessfulLogin(req.ip);

      return res.ok(
        {
          token,
          user: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role_name
          }
        },
        'Authentication successful.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current Logged-in User
   */
  getMe: async (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new AppError(
            'No active session found.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      return res.ok(
        {
          user: {
            id: req.user.id,
            name: req.user.full_name,
            email: req.user.email,
            role: req.user.role_name
          }
        },
        'Active user session retrieved.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Forgot Password - Step 1: Send OTP code to email
   */
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) {
        throw new AppError('No account found with this email address.', HttpStatusCodes.NOT_FOUND);
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError(`This account is currently ${user.status}. Please contact support.`, HttpStatusCodes.FORBIDDEN);
      }

      // Check cooldown in fast memory
      const cached = passwordResetMemoryCache.get(email);
      if (cached && (Date.now() - cached.createdAtMs) < 60 * 1000) {
        const remaining = Math.ceil((60 * 1000 - (Date.now() - cached.createdAtMs)) / 1000);
        throw new AppError(
          `Please wait ${remaining} seconds before requesting another code.`,
          HttpStatusCodes.TOO_MANY_REQUESTS
        );
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Fast memory caching
      passwordResetMemoryCache.set(email, {
        otp,
        expiresAtMs: expiresAt.getTime(),
        attempts: 0,
        createdAtMs: Date.now()
      });

      // DB persistence in background (non-blocking)
      (async () => {
        try {
          const otpHash = await bcrypt.hash(otp, 8);
          await passwordResetOtpModel.saveOtp({ email, otpHash, expiresAt });
        } catch (e) {
          console.warn('[RESET] Async DB backup warning:', e.message);
        }
      })();

      console.log(`[AUTH] Password Reset OTP generated for ${email}`);

      // Background email dispatch
      emailService.sendPasswordResetEmail(email, otp).catch(err => {
        console.error(`[EMAIL] Background password reset email error for ${email}:`, err.message);
      });

      return res.ok(
        null,
        'A 6-digit password reset verification code has been sent to your email.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset Password - Step 2: Verify OTP and set new password
   */
  resetPassword: async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;

      const [user] = await Promise.all([
        userModel.findByEmail(email)
      ]);

      if (!user) {
        throw new AppError('No account found with this email address.', HttpStatusCodes.NOT_FOUND);
      }

      const cleanOtp = String(otp).trim();
      const cached = passwordResetMemoryCache.get(email);

      let isMatch = false;

      // Fast Memory Verification
      if (cached) {
        if (Date.now() > cached.expiresAtMs) {
          passwordResetMemoryCache.delete(email);
          passwordResetOtpModel.delete(email).catch(() => {});
          throw new AppError('Verification code has expired. Please request a new reset code.', HttpStatusCodes.BAD_REQUEST);
        }

        if (cached.attempts >= 5) {
          passwordResetMemoryCache.delete(email);
          passwordResetOtpModel.delete(email).catch(() => {});
          throw new AppError('Maximum verification attempts exceeded. Please request a new reset code.', HttpStatusCodes.FORBIDDEN);
        }

        isMatch = crypto.timingSafeEqual(
          Buffer.from(cleanOtp.padEnd(6, ' ')),
          Buffer.from(String(cached.otp).padEnd(6, ' '))
        );

        if (!isMatch) {
          cached.attempts += 1;
          recordFailedOtp(req.ip);
          const remaining = 5 - cached.attempts;
          if (remaining <= 0) {
            passwordResetMemoryCache.delete(email);
            passwordResetOtpModel.delete(email).catch(() => {});
            throw new AppError('Maximum attempts exceeded. This code is locked. Please request a new code.', HttpStatusCodes.FORBIDDEN);
          }
          throw new AppError(`Wrong verification code. ${remaining} attempts remaining. Please check your code and try again.`, HttpStatusCodes.BAD_REQUEST);
        }

        passwordResetMemoryCache.delete(email);
        passwordResetOtpModel.delete(email).catch(() => {});

      } else {
        // Fallback to database
        const record = await passwordResetOtpModel.findByEmail(email);
        if (!record) {
          throw new AppError('Password reset code has expired or was not found. Please request a new code.', HttpStatusCodes.BAD_REQUEST);
        }

        if (record.attempts >= 5) {
          throw new AppError('Maximum verification attempts exceeded. Please request a new reset code.', HttpStatusCodes.FORBIDDEN);
        }

        isMatch = await bcrypt.compare(cleanOtp, record.otp_hash);
        if (!isMatch) {
          recordFailedOtp(req.ip);
          await passwordResetOtpModel.incrementAttempts(email);
          const remaining = 5 - (record.attempts + 1);
          if (remaining <= 0) {
            throw new AppError('Maximum attempts exceeded. This code is locked. Please request a new code.', HttpStatusCodes.FORBIDDEN);
          }
          throw new AppError(`Wrong verification code. ${remaining} attempts remaining. Please check your code and try again.`, HttpStatusCodes.BAD_REQUEST);
        }

        if (new Date(record.expires_at) < new Date()) {
          await passwordResetOtpModel.delete(email);
          throw new AppError('Verification code has expired. Please request a new reset code.', HttpStatusCodes.BAD_REQUEST);
        }

        await passwordResetOtpModel.delete(email);
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await userModel.updatePassword(email, newHash);
      recordSuccessfulLogin(req.ip);

      return res.ok(
        null,
        'Your password has been successfully reset. You may now log in with your new password.'
      );
    } catch (error) {
      next(error);
    }
  }
};

export default authController;