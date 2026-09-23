import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { recordAttackStrike } from './ipBlocker.js';

/**
 * Common SQL Injection payload signatures
 */
const SQL_INJECTION_PATTERNS = [
  // Union based injection
  /(\bunion\b\s+(all\s+)?\bselect\b)/i,
  // Boolean-based tautologies (e.g. ' OR '1'='1', ' OR 1=1)
  /('\s+or\s+('?[^']+'?\s*=\s*'?[^']+'?|\d+\s*=\s*\d+))/i,
  /("\s+or\s+("?[^"]+"?\s*=\s*"?[^"]+"?|\d+\s*=\s*\d+))/i,
  // Statement stacking (e.g. ; DROP TABLE, ; TRUNCATE)
  /(;\s*(drop|alter|truncate|create)\s+(table|database|schema))/i,
  /(;\s*(delete\s+from|insert\s+into|update\s+[\w`]+\s+set))/i,
  // Time delay & execution functions
  /(\b(sleep|benchmark)\s*\(.*\))/i,
  /(\bwaitfor\s+delay\b)/i,
  // Exec / system execution
  /(\bexec(\s+|\+)+(xp_cmdshell|sp_executesql)\b)/i
];

/**
 * Fields to exclude from SQL injection string checks (e.g. passwords which are only hashed via bcrypt)
 */
const EXCLUDED_FIELDS = new Set([
  'password',
  'confirmPassword',
  'newPassword',
  'currentPassword',
  'oldPassword'
]);

/**
 * Recursively inspect values for malicious SQL injection patterns
 */
const containsSqlInjection = (value, key = '') => {
  if (value === null || value === undefined) {
    return false;
  }

  // Skip password fields
  if (EXCLUDED_FIELDS.has(key)) {
    return false;
  }

  if (typeof value === 'string') {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some(item => containsSqlInjection(item, key));
  }

  if (typeof value === 'object') {
    return Object.entries(value).some(([k, v]) => containsSqlInjection(v, k));
  }

  return false;
};

/**
 * Global SQL Injection Prevention Middleware
 */
export const sqlSanitizer = (req, res, next) => {
  const sources = [
    { name: 'body', data: req.body },
    { name: 'query', data: req.query },
    { name: 'params', data: req.params }
  ];

  for (const { name, data } of sources) {
    if (data && containsSqlInjection(data)) {
      console.warn(`[SECURITY] SQL Injection attempt detected and blocked in request ${name}:`, req.ip);
      recordAttackStrike(req.ip, `SQL_INJECTION_${name.toUpperCase()}`);
      return ApiResponse.error(
        res,
        'Malicious input detected. Your request was blocked for security reasons.',
        null,
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  next();
};

export default sqlSanitizer;
