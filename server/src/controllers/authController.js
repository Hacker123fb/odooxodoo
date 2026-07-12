import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

/**
 * Helper to generate JWT Token
 */
const signToken = (userId, roleName) => {
  return jwt.sign({ id: userId, role: roleName }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });
};

/**
 * Authentication Route Handlers
 */
export const authController = {
  /**
   * Register a new user account
   */
  register: async (req, res, next) => {
    const { email, password, fullName, phone, roleName } = req.body;

    // 1. Verify email uniqueness
    const userExists = await userModel.findByEmail(email);
    if (userExists) {
      return next(new AppError('This email is already registered.', HttpStatusCodes.CONFLICT));
    }

    // 2. Fetch target Role details
    const roleRecord = await userModel.getRoleByName(roleName);
    if (!roleRecord) {
      return next(new AppError(`The role '${roleName}' is invalid.`, HttpStatusCodes.BAD_REQUEST));
    }

    // 3. Encrypt password credentials
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save record
    const userId = await userModel.create({
      roleId: roleRecord.id,
      fullName,
      email,
      passwordHash: hashedPassword,
      phone
    });

    // 5. Issue user token
    const token = signToken(userId, roleName);

    return res.created({
      token,
      user: {
        id: userId,
        fullName,
        email,
        role: roleName
      }
    }, 'Account registered successfully.');
  },

  /**
   * Log in user
   */
  login: async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check user registration & active status
    const user = await userModel.findByEmail(email);
    if (!user) {
      return next(new AppError('Invalid email or password.', HttpStatusCodes.UNAUTHORIZED));
    }
    
    if (user.status !== 'ACTIVE') {
      return next(new AppError(`Your account is currently ${user.status}. Please contact support.`, HttpStatusCodes.FORBIDDEN));
    }

    // 2. Compare passwords
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return next(new AppError('Invalid email or password.', HttpStatusCodes.UNAUTHORIZED));
    }

    // 3. Update logging audits
    await userModel.updateLastLogin(user.id);

    // 4. Sign session token
    const token = signToken(user.id, user.role_name);

    return res.ok({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name
      }
    }, 'Authentication successful.');
  },

  /**
   * Retrieves active session details
   */
  getMe: async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No active session found.', HttpStatusCodes.UNAUTHORIZED));
    }

    return res.ok({
      user: {
        id: req.user.id,
        fullName: req.user.full_name,
        email: req.user.email,
        role: req.user.role_name
      }
    }, 'Active user session retrieved.');
  }
};

export default authController;
