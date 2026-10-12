import type { BetterAuthOptions } from "better-auth";

export const authRateLimitOptions = {
  advanced: {
    ipAddress: {
      // The direct Next.js server preserves caller-supplied forwarding headers.
      // With no trusted ingress, use Better Auth's shared per-path bucket.
      // Do not set disableIpTracking: that also disables rate limiting.
      ipAddressHeaders: [],
    },
  },
} satisfies BetterAuthOptions;
