import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!insforgeUrl || !insforgeAnonKey) {
  throw new Error("Faltan las variables de entorno de InsForge.");
}

export const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

// Helper: ensures auth token is active and returns the singleton client
export function getAuthClient(accessToken) {
  // Try to set token via known SDK internals if provided
  const token = accessToken ||
    insforge.auth?.tokenManager?.getAccessToken?.() ||
    insforge.auth?.tokenManager?.accessToken;

  if (token) {
    // Try all known paths for setting auth token on the HTTP client
    if (typeof insforge.auth?.http?.setAuthToken === 'function') {
      insforge.auth.http.setAuthToken(token);
    }
    if (typeof insforge.http?.setAuthToken === 'function') {
      insforge.http.setAuthToken(token);
    }
  }
  return insforge;
}
