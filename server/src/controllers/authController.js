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

/**
 * Generate JWT Token
 */
const signToken = (userId, roleName) => {
  return jwt.sign(
    {
      id: userId,
      role: roleName
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn
    }
  );
};

/**
 * Authentication Controller with OTP Verification Flow
 */
export const authController = {
  /**
   * Register User (Phase 1: Validate details and send OTP)
   */
  register: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, roleName, employeeCode } = req.body;

      // 1. Verify email uniqueness
      const userExists = await userModel.findByEmail(email);
      if (userExists) {
        throw new AppError('Email already registered.', HttpStatusCodes.CONFLICT);
      }

      // 2. Verify mobile number uniqueness
      const [userPhoneExists] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
      const [driverPhoneExists] = await pool.query('SELECT id FROM drivers WHERE phone = ?', [phone]);
      if (userPhoneExists.length > 0 || driverPhoneExists.length > 0) {
        throw new AppError('Mobile number already registered.', HttpStatusCodes.CONFLICT);
      }

      // 3. Verify employee ID/code uniqueness
      const [employeeCodeExists] = await pool.query('SELECT id FROM drivers WHERE employee_id = ?', [employeeCode]);
      if (employeeCodeExists.length > 0) {
        throw new AppError('Employee Code already exists.', HttpStatusCodes.CONFLICT);
      }

      // 4. Validate system role
      const roleRecord = await userModel.getRoleByName(roleName);
      if (!roleRecord) {
        throw new AppError(`The role '${roleName}' is invalid.`, HttpStatusCodes.BAD_REQUEST);
      }

      // 5. Hash password before temporarily storing it in the OTP session
      const hashedPassword = await bcrypt.hash(password, 10);

      // 6. Generate and save secure OTP record
      const otp = await otpService.generateOtp(email, {
        fullName,
        employeeCode,
        email,
        phone,
        password: hashedPassword,
        roleName
      });

      console.log(`[AUTH] Registration OTP generated for ${email}: ${otp}`);

      // 7. Dispatch OTP code to user email in background (non-blocking)
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
   * Verify OTP (Phase 2: Create user record on success)
   */
  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      // 1. Verify OTP code and retrieve registration details
      const regData = await otpService.verifyOtp(email, otp);

      // 2. Double-check email/phone/employee code uniqueness once more at verification time (anti-concurrency)
      const userExists = await userModel.findByEmail(email);
      if (userExists) {
        throw new AppError('Email already registered.', HttpStatusCodes.CONFLICT);
      }

      const [userPhoneExists] = await pool.query('SELECT id FROM users WHERE phone = ?', [regData.phone]);
      if (userPhoneExists.length > 0) {
        throw new AppError('Mobile number already registered.', HttpStatusCodes.CONFLICT);
      }

      // 3. Fetch validated role
      const roleRecord = await userModel.getRoleByName(regData.roleName);
      if (!roleRecord) {
        throw new AppError('Invalid role specified.', HttpStatusCodes.BAD_REQUEST);
      }

      // 4. Provision active user account in database
      const userId = await userModel.create({
        roleId: roleRecord.id,
        fullName: regData.fullName,
        email: regData.email,
        passwordHash: regData.password, // already hashed
        phone: regData.phone
      });

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
      next(error);
    }
  },

  /**
   * Resend Registration OTP
   */
  resendOtp: async (req, res, next) => {
    try {
      const { email } = req.body;

      // Generate a new OTP using the existing registration payload
      const otp = await otpService.generateOtp(email, null, true);

      console.log(`[AUTH] Resent OTP generated for ${email}: ${otp}`);

      // Send the new OTP to email in background (non-blocking)
      emailService.sendOtpEmail(email, otp).catch(err => {
        console.error(`[EMAIL] Background resend OTP error for ${email}:`, err.message);
      });

      return res.ok(
        null,
        'OTP sent successfully. Please check your registered email inbox.'
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

      // Find user
      const user = await userModel.findByEmail(email);

      if (!user) {
        return next(
          new AppError(
            'Invalid email or password.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      // Check status
      if (user.status !== 'ACTIVE') {
        return next(
          new AppError(
            `Your account is currently ${user.status}. Please contact support.`,
            HttpStatusCodes.FORBIDDEN
          )
        );
      }

      // Verify password
      const passwordMatched = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!passwordMatched) {
        return next(
          new AppError(
            'Invalid email or password.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      // Update last login
      await userModel.updateLastLogin(user.id);

      // Generate JWT
      const token = signToken(user.id, user.role_name);

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

      const existing = await passwordResetOtpModel.findByEmail(email);
      if (existing) {
        const elapsed = (new Date().getTime() - new Date(existing.created_at).getTime()) / 1000;
        if (elapsed < 60) {
          throw new AppError(
            `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting another code.`,
            HttpStatusCodes.TOO_MANY_REQUESTS
          );
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(new Date().getTime() + 10 * 60 * 1000);

      await passwordResetOtpModel.saveOtp({
        email,
        otpHash,
        expiresAt
      });

      console.log(`[AUTH] Password Reset OTP generated for ${email}: ${otp}`);

      // Send the password reset code in background (non-blocking)
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

      const user = await userModel.findByEmail(email);
      if (!user) {
        throw new AppError('No account found with this email address.', HttpStatusCodes.NOT_FOUND);
      }

      const record = await passwordResetOtpModel.findByEmail(email);
      if (!record) {
        throw new AppError('Password reset code has expired or was not found. Please request a new code.', HttpStatusCodes.BAD_REQUEST);
      }

      if (record.attempts >= 5) {
        throw new AppError('Maximum verification attempts exceeded. Please request a new reset code.', HttpStatusCodes.FORBIDDEN);
      }

      const isMatch = await bcrypt.compare(otp, record.otp_hash);
      if (!isMatch) {
        await passwordResetOtpModel.incrementAttempts(email);
        const remaining = 5 - (record.attempts + 1);
        if (remaining <= 0) {
          throw new AppError('Maximum attempts exceeded. This code is locked. Please request a new code.', HttpStatusCodes.FORBIDDEN);
        }
        throw new AppError(`Invalid verification code. ${remaining} attempts remaining.`, HttpStatusCodes.BAD_REQUEST);
      }

      if (new Date(record.expires_at) < new Date()) {
        await passwordResetOtpModel.delete(email);
        throw new AppError('Verification code has expired. Please request a new reset code.', HttpStatusCodes.BAD_REQUEST);
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await userModel.updatePassword(email, newHash);
      await passwordResetOtpModel.delete(email);

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