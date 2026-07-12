import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

/**
 * Middleware to attach convenient, standardized formatting methods to the Express response object
 */
export const responseFormatter = (req, res, next) => {
  res.ok = (data = null, message = 'Success') => {
    return ApiResponse.success(res, message, data, HttpStatusCodes.OK);
  };

  res.created = (data = null, message = 'Created successfully') => {
    return ApiResponse.success(res, message, data, HttpStatusCodes.CREATED);
  };

  res.noContent = () => {
    return res.status(HttpStatusCodes.NO_CONTENT).send();
  };

  next();
};

export default responseFormatter;
