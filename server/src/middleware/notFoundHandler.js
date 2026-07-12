import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { Constants } from '../utils/constants.js';

/**
 * Middleware to handle 404 Not Found routes
 */
export const notFoundHandler = (req, res, next) => {
  next(
    new AppError(
      `${Constants.MESSAGES.ROUTE_NOT_FOUND}: ${req.originalUrl}`,
      HttpStatusCodes.NOT_FOUND
    )
  );
};

export default notFoundHandler;
