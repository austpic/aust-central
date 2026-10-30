import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { loadTransport } from '../prisma/transport.js';

/**
 * Load campus transport data from a JSON file. Production-safe and idempotent.
 *
 *   npm run transport:load -- path/to/transport.json
 *
 * The file's shape is prisma/transport.example.json (validated before anything
 * is written). The example ships placeholder driver numbers, so production
 * should load a file with the real ones.
 */

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run transport:load -- <path/to/transport.json>');
  process.exit(2);
}

const prisma = new PrismaClient();

try {
  const raw = JSON.parse(await readFile(path.resolve(file), 'utf8'));
  const result = await loadTransport(prisma, raw);
  console.log(
    `Loaded ${result.stops} stops and ${result.buses} buses` +
      (result.deactivated ? `; marked ${result.deactivated} unlisted bus(es) inactive.` : '.'),
  );
} catch (error) {
  if (error?.issues) {
    console.error('Transport file is invalid:');
    for (const issue of error.issues) {
      console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
  } else {
    console.error(error);
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
