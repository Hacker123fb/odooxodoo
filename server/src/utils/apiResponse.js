export class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {object} res Express response object
   * @param {string} message Custom message
   * @param {any} data Response data payload
   * @param {number} statusCode HTTP status code (default 200)
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send an error JSON response
   * @param {object} res Express response object
   * @param {string} message Custom error message
   * @param {any} errors Specific validation or error details
   * @param {number} statusCode HTTP status code (default 500)
   */
  static error(res, message = 'An error occurred', errors = null, statusCode = 500) {
    const payload = {
      success: false,
      message
    };
    
    if (errors !== null) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;
