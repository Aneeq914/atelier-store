import { formatWithOptions } from "node:util";
import type { BetterAuthOptions } from "better-auth";

export const authLogger = {
  log(level, message, ...args) {
    // Format every argument before encoding so errors and objects cannot add lines.
    const record = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      source: "Better Auth",
      message: formatWithOptions({ colors: false }, message, ...args),
    }).replace(
      // JSON escapes C0 controls; also escape C1 controls and Unicode separators.
      /[\u007f-\u009f\u2028\u2029]/g,
      (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );

    if (level === "error") console.error(record);
    else if (level === "warn") console.warn(record);
    else console.log(record);
  },
} satisfies NonNullable<BetterAuthOptions["logger"]>;
