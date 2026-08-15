/**
 * Where the web client looks for the AUST Central API.
 *
 * Mirrors mobile/aust-central/lib/data/api/api_client.dart's ApiConfig — same
 * idea, browser-appropriate default. Override at build/dev time:
 *   VITE_API_BASE_URL=http://localhost:3000/api/v1 npm run dev
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3000/api/v1';

export const REQUEST_TIMEOUT_MS = 20_000;
