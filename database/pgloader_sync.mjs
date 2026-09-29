// =============================================================================
// FILE: database/pgloader_sync.mjs
// Delegates to server/scripts/pgloader_sync.js with proper server/node_modules resolution
// =============================================================================

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetScript = path.resolve(__dirname, '../server/scripts/pgloader_sync.js');
await import(`file://${targetScript.replace(/\\/g, '/')}`);
