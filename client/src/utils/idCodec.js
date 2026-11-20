/**
 * Reversible High-Performance Alphanumeric ID Codec (Client)
 * Replaces raw sequential database IDs (e.g., /drivers/edit/5) with
 * unique, collision-free, enterprise-grade alphanumeric IDs (e.g., /drivers/edit/DRV-LC3A5W).
 */

const MULTIPLIER = 2654435761n;
const INVERSE = 244002641n;
const MODULO = 4294967296n; // 2^32
const MASK = 0x5bf03641n;

const PREFIX_MAP = {
  driver: 'DRV',
  drivers: 'DRV',
  vehicle: 'VEH',
  vehicles: 'VEH',
  trip: 'TRP',
  trips: 'TRP',
  maintenance: 'MNT',
  fuel: 'FUL',
  fuel_log: 'FUL',
  fuel_logs: 'FUL',
  expense: 'EXP',
  expenses: 'EXP',
  user: 'USR',
  users: 'USR'
};

/**
 * Encodes an internal database integer ID into a unique alphanumeric public ID
 * @param {string} type - Entity type (e.g. 'driver', 'vehicle', 'trip')
 * @param {number|string} id - Database integer ID
 * @returns {string} Formatted public ID (e.g. 'DRV-LC3A5W')
 */
export const encodeId = (type, id) => {
  if (id === null || id === undefined || id === '') return '';
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0) return String(id);

  try {
    const n = BigInt(num);
    const scrambled = ((n * MULTIPLIER) % MODULO) ^ MASK;
    const code = scrambled.toString(36).toUpperCase().padStart(6, '0');
    const p = (PREFIX_MAP[String(type).toLowerCase()] || String(type).toUpperCase().slice(0, 3));
    return `${p}-${code}`;
  } catch {
    return String(id);
  }
};

/**
 * Decodes an alphanumeric public ID back into the internal database integer ID
 * @param {string|number} str - Public ID or numeric string
 * @returns {number|null} Database integer ID
 */
export const decodeId = (str) => {
  if (str === null || str === undefined || str === '') return null;
  if (typeof str === 'number') return str > 0 ? str : null;

  const raw = String(str).trim();
  if (/^\d+$/.test(raw)) {
    const num = parseInt(raw, 10);
    return num > 0 ? num : null;
  }

  const parts = raw.split('-');
  const code = parts.length > 1 ? parts[1] : parts[0];
  try {
    const scrambled = BigInt(parseInt(code, 36));
    if (isNaN(Number(scrambled))) return null;
    const unmasked = scrambled ^ MASK;
    const original = (unmasked * INVERSE) % MODULO;
    const id = Number(original);
    return id > 0 ? id : null;
  } catch {
    return null;
  }
};

export default {
  encodeId,
  decodeId
};
