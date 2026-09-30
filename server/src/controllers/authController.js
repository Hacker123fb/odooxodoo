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
import {
  recordFailedLogin,
  recordSuccessfulLogin,
  recordFailedOtp,
  getAccountLockDetails,
  getClientIp
} from '../middleware/ipBlocker.js';

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

// Cryptographic Backend Signature Generator for Critical Security Operations
export const createSecuritySignature = (action, identifier, metadata = {}) => {
  const timestamp = Date.now();
  const rawPayload = `${action}:${identifier}:${timestamp}`;
  const hmac = crypto
    .createHmac('sha256', env.jwt.secret || 'transitops-security-secret')
    .update(rawPayload)
    .digest('hex');

  return {
    securitySignature: `sec_sig_${hmac}`,
    verifiedAt: timestamp,
    action,
    identifier,
    ...metadata
  };
};

/**
 * Authentication Controller with Ultra-Fast OTP Verification and Dual-Layer Brute Force Defense
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

      if (roleName === 'SUPER_ADMIN') {
        throw new AppError('Registration for Super Admin is strictly prohibited. The system root Super Admin account is pre-provisioned.', HttpStatusCodes.FORBIDDEN);
      }

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

      // Account-level lockout check
      if (email) {
        const lockDetails = getAccountLockDetails(email);
        if (lockDetails) {
          return res.status(HttpStatusCodes.FORBIDDEN).json({
            success: false,
            message: `Account Locked: This account has been temporarily locked for ${lockDetails.formattedDuration}. Please try again later.`,
            code: 'ACCOUNT_LOCKED',
            reason: lockDetails.reason,
            remainingMinutes: lockDetails.remainingMinutes,
            tier: lockDetails.tier
          });
        }
      }

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
      if (regData.roleName === 'SUPER_ADMIN') {
        throw new AppError('Registration for Super Admin is strictly prohibited.', HttpStatusCodes.FORBIDDEN);
      }

      // 3. Provision user account with PENDING_APPROVAL status
      const userId = await userModel.create({
        roleId: roleRecord.id,
        fullName: regData.fullName,
        email: regData.email,
        passwordHash: regData.password,
        phone: regData.phone,
        status: 'PENDING_APPROVAL'
      });

      // Clear any previous failed attempts
      recordSuccessfulLogin(getClientIp(req), email);

      const securityProof = createSecuritySignature('REGISTRATION_OTP_VERIFIED', regData.email, { userId });

      return res.ok(
        {
          user: {
            id: userId,
            name: regData.fullName,
            email: regData.email,
            role: regData.roleName,
            status: 'PENDING_APPROVAL'
          },
          pendingApproval: true,
          securitySignature: securityProof.securitySignature,
          verifiedAt: securityProof.verifiedAt,
          action: securityProof.action,
          identifier: securityProof.identifier
        },
        'Registration submitted successfully! Your account is pending administrative approval by a Super Admin or Fleet Manager before access is granted.'
      );
    } catch (error) {
      if (error.statusCode === HttpStatusCodes.BAD_REQUEST || error.statusCode === HttpStatusCodes.FORBIDDEN) {
        recordFailedOtp(getClientIp(req), req.body?.email);
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

      // 1. Anti-IP-Hopping Defense: Check if this target account is locked across IPs
      if (email) {
        const lockDetails = getAccountLockDetails(email);
        if (lockDetails) {
          return res.status(HttpStatusCodes.FORBIDDEN).json({
            success: false,
            message: `Account Locked: This account has been temporarily locked for ${lockDetails.formattedDuration} due to repeated failed attempts across multiple locations. Please try again later.`,
            code: 'ACCOUNT_LOCKED',
            reason: lockDetails.reason,
            remainingMinutes: lockDetails.remainingMinutes,
            tier: lockDetails.tier
          });
        }
      }

      const user = await userModel.findByEmail(email);

      if (!user) {
        recordFailedLogin(getClientIp(req), email);
        return next(
          new AppError(
            'No account found with this email address.',
            HttpStatusCodes.UNAUTHORIZED
          )
        );
      }

      if (user.status !== 'ACTIVE') {
        if (user.status === 'PENDING_APPROVAL') {
          return next(
            new AppError(
              'Your registration is currently pending approval by a Super Admin or Fleet Manager. You will be able to sign in once authorized.',
              HttpStatusCodes.FORBIDDEN
            )
          );
        }
        if (user.status === 'REJECTED') {
          return next(
            new AppError(
              'Your account registration request has been rejected by administration.',
              HttpStatusCodes.FORBIDDEN
            )
          );
        }
        return next(
          new AppError(
            `Your account is currently ${user.status}. Please contact support.`,
            HttpStatusCodes.FORBIDDEN
          )
        );
      }

      const passwordMatched = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatched) {
        // Record failed attempt on both IP and Target Account!
        recordFailedLogin(getClientIp(req), email);
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
      // Reset strike counters for both IP and Account on success
      recordSuccessfulLogin(getClientIp(req), email);

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

      if (email) {
        const lockDetails = getAccountLockDetails(email);
        if (lockDetails) {
          return res.status(HttpStatusCodes.FORBIDDEN).json({
            success: false,
            message: `Account Locked: This account is temporarily locked for ${lockDetails.formattedDuration}. Please try again later.`,
            code: 'ACCOUNT_LOCKED',
            reason: lockDetails.reason,
            remainingMinutes: lockDetails.remainingMinutes
          });
        }
      }

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

      if (email) {
        const lockDetails = getAccountLockDetails(email);
        if (lockDetails) {
          return res.status(HttpStatusCodes.FORBIDDEN).json({
            success: false,
            message: `Account Locked: This account is temporarily locked for ${lockDetails.formattedDuration}. Please try again later.`,
            code: 'ACCOUNT_LOCKED',
            reason: lockDetails.reason,
            remainingMinutes: lockDetails.remainingMinutes
          });
        }
      }

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
          recordFailedOtp(getClientIp(req), email);
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
          recordFailedOtp(getClientIp(req), email);
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
      recordSuccessfulLogin(getClientIp(req), email);

      const securityProof = createSecuritySignature('PASSWORD_RESET_VERIFIED', email);

      return res.ok(
        {
          securitySignature: securityProof.securitySignature,
          verifiedAt: securityProof.verifiedAt,
          action: securityProof.action,
          identifier: securityProof.identifier
        },
        'Your password has been successfully reset. You may now log in with your new password.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete User Account (Permanent removal with data integrity safeguards)
   */
  deleteAccount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { password, confirmText } = req.body;

      if (!password) {
        throw new AppError('Password confirmation is required to delete your account.', HttpStatusCodes.BAD_REQUEST);
      }

      if (confirmText !== 'DELETE') {
        throw new AppError('Please type DELETE to confirm account deletion.', HttpStatusCodes.BAD_REQUEST);
      }

      // 1. Fetch user record with password hash
      const [userRows] = await pool.query(
        'SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
        [userId]
      );
      if (userRows.length === 0) {
        throw new AppError('User account not found.', HttpStatusCodes.NOT_FOUND);
      }
      const user = userRows[0];

      // 2. Verify password with bcrypt
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        recordFailedLogin(getClientIp(req), user.email);
        throw new AppError('Incorrect password. Account deletion aborted.', HttpStatusCodes.UNAUTHORIZED);
      }

      // 3. Prevent deletion of the sole Super Administrator
      if (user.role_name === 'SUPER_ADMIN') {
        const [superAdminRows] = await pool.query(
          "SELECT COUNT(u.id) AS count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'SUPER_ADMIN' AND u.id != ? AND u.status = 'ACTIVE'",
          [userId]
        );
        const otherAdmins = parseInt(superAdminRows[0]?.count || 0, 10);
        if (otherAdmins === 0) {
          throw new AppError('You cannot delete the sole Super Administrator account. Please designate another Super Admin first.', HttpStatusCodes.FORBIDDEN);
        }
      }

      // 4. Safe Resource Reassignment
      // Find a fallback administrator to inherit created records so CASCADE DELETE doesn't wipe fleet assets
      const [adminRows] = await pool.query(
        "SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'SUPER_ADMIN' AND u.id != ? AND u.status = 'ACTIVE' ORDER BY u.id ASC LIMIT 1",
        [userId]
      );
      const fallbackAdminId = adminRows[0]?.id || null;

      if (fallbackAdminId) {
        await pool.query('UPDATE vehicles SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE drivers SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE trips SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE maintenance_logs SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE fuel_logs SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE expenses SET created_by = ? WHERE created_by = ?', [fallbackAdminId, userId]);
        await pool.query('UPDATE expenses SET approved_by = ? WHERE approved_by = ?', [fallbackAdminId, userId]);
      }

      // 5. Unlink driver profile if applicable
      await pool.query('UPDATE drivers SET user_id = NULL WHERE user_id = ?', [userId]);

      // 6. Delete user notifications and finally the user record
      await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);

      console.warn(`[SECURITY] User account ${user.email} (ID: ${userId}) permanently deleted upon authorized request.`);

      const securityProof = createSecuritySignature('ACCOUNT_DELETED_VERIFIED', user.email, { userId });

      return res.ok(
        {
          securitySignature: securityProof.securitySignature,
          verifiedAt: securityProof.verifiedAt,
          action: securityProof.action,
          identifier: securityProof.identifier
        },
        'Your account and associated personal data have been permanently deleted.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify Backend Security Signature
   * Validates cryptographic HMAC signature issued for critical operations.
   */
  verifySecuritySignature: async (req, res, next) => {
    try {
      const { signature, action, identifier, timestamp } = req.body;
      if (!signature || !action || !identifier || !timestamp) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          valid: false,
          message: 'Missing security signature parameters.'
        });
      }

      // Check replay / expiration (valid for 5 minutes)
      const now = Date.now();
      const ageMs = Math.abs(now - Number(timestamp));
      if (ageMs > 5 * 60 * 1000) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          valid: false,
          message: 'Security signature has expired.'
        });
      }

      const expectedPayload = `${action}:${identifier}:${timestamp}`;
      const expectedHmac = `sec_sig_${crypto
        .createHmac('sha256', env.jwt.secret || 'transitops-security-secret')
        .update(expectedPayload)
        .digest('hex')}`;

      // Constant-time comparison
      const isValid = signature.length === expectedHmac.length && crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedHmac)
      );

      if (!isValid) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          valid: false,
          message: 'Cryptographic backend signature mismatch. Verification failed.'
        });
      }

      return res.status(HttpStatusCodes.OK).json({
        success: true,
        valid: true,
        action,
        verifiedAt: timestamp,
        message: 'Authoritative backend signature successfully validated.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all registrations pending approval (Super Admin and Fleet Manager only)
   */
  getPendingApprovals: async (req, res, next) => {
    try {
      const pendingUsers = await userModel.getPendingUsers();
      return res.ok(
        pendingUsers,
        'Pending registrations retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Approve a pending user account
   */
  approveUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const targetUser = await userModel.findById(id);
      if (!targetUser) {
        throw new AppError('User not found.', HttpStatusCodes.NOT_FOUND);
      }
      if (targetUser.status !== 'PENDING_APPROVAL') {
        throw new AppError(`User account is not pending approval (current status: ${targetUser.status}).`, HttpStatusCodes.BAD_REQUEST);
      }
      await userModel.updateStatus(id, 'ACTIVE');

      return res.ok(
        { id, status: 'ACTIVE', email: targetUser.email },
        `User account ${targetUser.email} has been approved successfully.`
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject a pending user account
   */
  rejectUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const targetUser = await userModel.findById(id);
      if (!targetUser) {
        throw new AppError('User not found.', HttpStatusCodes.NOT_FOUND);
      }
      if (targetUser.status !== 'PENDING_APPROVAL') {
        throw new AppError(`User account is not pending approval (current status: ${targetUser.status}).`, HttpStatusCodes.BAD_REQUEST);
      }
      await userModel.updateStatus(id, 'REJECTED');

      return res.ok(
        { id, status: 'REJECTED', email: targetUser.email },
        `User account ${targetUser.email} registration has been rejected.`
      );
    } catch (error) {
      next(error);
    }
  }
};

export default authController;