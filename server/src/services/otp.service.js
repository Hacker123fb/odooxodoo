import bcrypt from 'bcryptjs';
import { otpModel } from '../models/otp.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

export const otpService = {
  /**
   * Generates a 6-digit numeric OTP and saves it to the database
   */
  async generateOtp(email, registrationData, isResend = false) {
    const existing = await otpModel.findByEmail(email);
    
    if (existing && isResend) {
      const elapsed = (new Date().getTime() - new Date(existing.created_at).getTime()) / 1000;
      if (elapsed < 60) {
        throw new AppError(
          `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting a new OTP.`,
          HttpStatusCodes.TOO_MANY_REQUESTS
        );
      }
    }

    // Generate secure 6-digit OTP (100000 - 999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // Set 3 minutes expiry
    const expiresAt = new Date(new Date().getTime() + 3 * 60 * 1000);
    
    // If it's a resend, preserve the registration data, otherwise use the new payload
    const finalRegData = registrationData || (existing ? JSON.parse(existing.registration_data) : null);
    if (!finalRegData) {
      throw new AppError('No registration details found.', HttpStatusCodes.BAD_REQUEST);
    }

    await otpModel.saveOtp({
      email,
      otpHash,
      expiresAt,
      registrationData: finalRegData
    });

    return otp; // Return clear OTP for email transmission (MUST NOT be sent to API response!)
  },

  /**
   * Validates the submitted OTP
   */
  async verifyOtp(email, submittedOtp) {
    const record = await otpModel.findByEmail(email);
    
    if (!record) {
      throw new AppError('OTP expired or not found. Please request a new registration OTP.', HttpStatusCodes.BAD_REQUEST);
    }

    if (record.attempts >= 5) {
      throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
    }

    const isMatch = await bcrypt.compare(submittedOtp, record.otp_hash);
    
    if (!isMatch) {
      await otpModel.incrementAttempts(email);
      const remaining = 5 - (record.attempts + 1);
      if (remaining <= 0) {
        throw new AppError('Maximum attempts exceeded. This OTP is locked. Please request a new OTP.', HttpStatusCodes.FORBIDDEN);
      }
      throw new AppError(`Invalid OTP. ${remaining} attempts remaining.`, HttpStatusCodes.BAD_REQUEST);
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await otpModel.delete(email);
      throw new AppError('OTP expired. Please request a new registration OTP.', HttpStatusCodes.BAD_REQUEST);
    }

    // Clean up OTP on success
    await otpModel.delete(email);

    return JSON.parse(record.registration_data);
  }
};

export default otpService;
