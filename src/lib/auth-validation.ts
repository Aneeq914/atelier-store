// Form rules shared by the browser (instant feedback) and the Server Actions
// (the real check, which also runs when JavaScript is off). Keep the messages
// short and say how to fix the problem.

export const LIMITS = {
  name: { max: 100 },
  email: { max: 254 },
  password: { min: 8, max: 128 },
} as const;

export type AuthField = "name" | "email" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value: string) {
  const name = value.trim();
  if (!name) return "Enter your name.";
  if (name.length > LIMITS.name.max) return `Use ${LIMITS.name.max} characters or fewer.`;
}

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > LIMITS.email.max || !EMAIL.test(email)) return "Enter a valid email address, like name@example.com.";
}

/** A new password (sign-up). */
export function validateNewPassword(value: string) {
  if (!value) return "Create a password.";
  if (value.length < LIMITS.password.min) return `Use at least ${LIMITS.password.min} characters.`;
  if (value.length > LIMITS.password.max) return `Use ${LIMITS.password.max} characters or fewer.`;
}

/** An existing password (sign-in): only check it was entered; the server decides if it's right. */
export function validateCurrentPassword(value: string) {
  if (!value) return "Enter your password.";
  if (value.length > LIMITS.password.max) return "That email and password don't match.";
}

const VALIDATORS = {
  "sign-in": { email: validateEmail, password: validateCurrentPassword },
  "sign-up": { name: validateName, email: validateEmail, password: validateNewPassword },
  profile: { name: validateName },
} satisfies Record<string, Partial<Record<AuthField, (value: string) => string | undefined>>>;

export type FormKind = keyof typeof VALIDATORS;

/** One field's error, or undefined. */
export function validateField(kind: FormKind, field: AuthField, value: string) {
  const validator = (VALIDATORS[kind] as Partial<Record<AuthField, (value: string) => string | undefined>>)[field];
  return validator?.(value);
}

/** Every field's error for a form; empty when valid. */
export function validateForm(kind: FormKind, values: Partial<Record<AuthField, string>>) {
  const errors: FieldErrors = {};
  for (const field of Object.keys(VALIDATORS[kind]) as AuthField[]) {
    const error = validateField(kind, field, values[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
