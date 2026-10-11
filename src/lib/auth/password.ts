/** Shared password rules for sign-up and password reset. Returns an error message, or null when valid. */
export function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < 8 || !/\d/.test(password) || !/[a-z]/i.test(password))
    return "Password must be at least 8 characters with letters and numbers.";
  if (password !== confirm) return "Passwords don't match.";
  return null;
}

/** Emails are compared case-insensitively by the auth service; trim stray spaces from autofill/paste. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
