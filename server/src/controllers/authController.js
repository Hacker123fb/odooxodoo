import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { otpService } from '../services/otp.service.js';
import { emailService } from '../services/email.service.js';
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

      // 7. Dispatch OTP code to user email
      await emailService.sendOtpEmail(email, otp);

      return res.ok(
        null,
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

      // Send the new OTP to email
      await emailService.sendOtpEmail(email, otp);

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
  }
};

export default authController;