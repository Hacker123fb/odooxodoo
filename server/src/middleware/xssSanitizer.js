/**
 * Global XSS Prevention & Input Truncation Middleware
 * Protects backend from Cross-Site Scripting (XSS), script injection,
 * malicious markup payloads, and buffer/string overflow attacks.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /\bon\w+\s*=/gi // onload=, onerror=, onclick=, onmouseover=
];

const EXCLUDED_FIELDS = new Set([
  'password',
  'confirmPassword',
  'newPassword',
  'currentPassword',
  'oldPassword'
]);

/**
 * Truncate strings to safe bounds per field role
 */
const getFieldMaxLength = (fieldName = '') => {
  const lower = fieldName.toLowerCase();
  if (lower.includes('email') || lower.includes('phone') || lower.includes('name') || lower.includes('license')) {
    return 255;
  }
  if (lower.includes('address') || lower.includes('notes') || lower.includes('description') || lower.includes('reason')) {
    return 5000;
  }
  if (EXCLUDED_FIELDS.has(fieldName)) {
    return 128; // BCrypt limit safety
  }
  return 1000; // Standard safe default
};

/**
 * Sanitize and truncate a single string value
 */
export const sanitizeString = (str, fieldName = '') => {
  if (typeof str !== 'string') return str;

  // Passwords are only length-truncated, never content-altered
  if (EXCLUDED_FIELDS.has(fieldName)) {
    return str.slice(0, 128);
  }

  let cleaned = str;
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Strip raw HTML tags while preserving text
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Truncate to maximum permissible length
  const maxLen = getFieldMaxLength(fieldName);
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }

  return cleaned.trim();
};

/**
 * Deep recursive sanitation for objects / arrays
 */
export const deepSanitize = (target, parentKey = '') => {
  if (target === null || target === undefined) return target;

  if (typeof target === 'string') {
    return sanitizeString(target, parentKey);
  }

  if (Array.isArray(target)) {
    return target.map((item, idx) => deepSanitize(item, `${parentKey}[${idx}]`));
  }

  if (typeof target === 'object' && target.constructor === Object) {
    const result = {};
    for (const [key, val] of Object.entries(target)) {
      result[key] = deepSanitize(val, key);
    }
    return result;
  }

  return target;
};

/**
 * Express Middleware Hook
 */
export const xssSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params);
  }

  next();
};

export default xssSanitizer;
