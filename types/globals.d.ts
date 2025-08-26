export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      // gate the app until TOTP is enrolled & verified:
      mfaComplete?: boolean;
      // (optional) per-user toggle so you can exempt staff, etc.
      requireMfa?: boolean;
    };
  }
}
