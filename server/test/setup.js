import { applyTestEnv } from './test-env.js';

/**
 * Runs before each test FILE's module graph is imported.
 *
 * This ordering is the whole point: `src/config/env.js` validates and freezes
 * process.env at import time, so the variables must already be in place before
 * anything under src/ is pulled in.
 */
applyTestEnv();
