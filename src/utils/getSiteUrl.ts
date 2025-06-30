// src/utils/getSiteUrl.ts

export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: usa la location reale
    return window.location.origin;
  }

  // Server-side: fallback su variabili env (durante build/deploy)
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
