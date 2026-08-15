import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';

/**
 * Without TypeScript, lint is the only static check we get — so it is tuned to
 * catch the classes of mistake a compiler would have caught, plus the
 * security-relevant patterns (unsafe regex, non-literal fs paths, eval).
 */
export default [
  { ignores: ['node_modules/**', 'coverage/**', 'storage/**', 'prisma/generated/**'] },

  js.configs.recommended,
  security.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Unused vars are usually a rename that half-landed.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // NOT `require-await`. Fastify requires handlers, hooks, and plugins to
      // be async so it can await their return value — an async function with
      // no await inside is correct and idiomatic here, so that rule reports
      // nothing but false positives.
      'no-return-await': 'off',
      'no-async-promise-executor': 'error',
      // These catch the actual async hazard: a promise whose rejection nobody
      // is listening to, and a `return` that escapes a try/finally.
      'no-promise-executor-return': 'error',
      'require-atomic-updates': 'error',

      'no-console': ['error', { allow: ['error', 'warn'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-throw-literal': 'error',

      // Every path here is built from our own config, never user input; the
      // rule cannot see that and fires on all of them.
      'security/detect-non-literal-fs-filename': 'off',
      // Prisma is parameterised throughout — this rule targets raw driver use.
      'security/detect-object-injection': 'off',
    },
  },

  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
    rules: {
      'security/detect-non-literal-regexp': 'off',
    },
  },

  {
    files: ['prisma/seed.js'],
    rules: {
      // Seeding is a CLI script; progress output belongs on stdout.
      'no-console': 'off',
    },
  },
];
