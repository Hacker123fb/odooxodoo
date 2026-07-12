import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

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
 * Authentication Controller
 */
export const authController = {
  /**
   * Register User
   */
  register: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, roleName } = req.body;

      // Check existing user
      const userExists = await userModel.findByEmail(email);

      if (userExists) {
        return next(
          new AppError(
            'This email is already registered.',
            HttpStatusCodes.CONFLICT
          )
        );
      }

      // Validate role
      const roleRecord = await userModel.getRoleByName(roleName);

      if (!roleRecord) {
        return next(
          new AppError(
            `The role '${roleName}' is invalid.`,
            HttpStatusCodes.BAD_REQUEST
          )
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = await userModel.create({
        roleId: roleRecord.id,
        fullName,
        email,
        passwordHash: hashedPassword,
        phone
      });

      // Generate token
      const token = signToken(userId, roleName);

      return res.created(
        {
          token,
          user: {
            id: userId,
            name: fullName,
            email,
            role: roleName
          }
        },
        'Account registered successfully.'
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