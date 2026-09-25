import "server-only";

type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Maps database/API errors to messages that are safe to show.
 * Raw messages can mention internal names, so they are only logged on the server.
 */
export function dbErrorMessage(error: DbError, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  switch (error.code) {
    case "P0002":
    case "PGRST116":
      return "Not found, or you don't have access to it.";
    case "42501":
      return "You don't have permission to do that.";
    case "23505":
      return "That already exists.";
    case "23503":
      return "That refers to something that no longer exists.";
    case "22023":
      return error.message ?? fallback; // raised by our own functions with user-facing text
    case "23514":
      return "Some values are out of range.";
  }
  console.error("Database error", error);
  return fallback;
}

type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

export function authErrorMessage(error: AuthError): string {
  switch (error?.code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the link.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "weak_password":
      return error.message ?? "That password is too weak.";
    case "same_password":
      return "Your new password must be different from the current one.";
    case "user_already_exists":
    case "email_exists":
      return "Could not create the account. Try signing in or resetting your password.";
    case "signup_disabled":
      return "Sign-ups are currently closed.";
  }
  if (error?.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  console.error("Auth error", error);
  return "Something went wrong. Please try again.";
}
