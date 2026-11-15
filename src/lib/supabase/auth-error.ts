/**
 * Turns cryptic browser network failures ("Failed to fetch" when the Supabase
 * stack is not running) into an actionable message, and passes through real
 * App/Auth errors from Supabase otherwise.
 */
export function authErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error && /failed to fetch|load failed|networkerror|fetch failed/i.test(cause.message)) {
    const target = process.env.NEXT_PUBLIC_SUPABASE_URL || "the configured Supabase URL";
    return `Can't reach the CampusLoop backend (Supabase at ${target}). Start it locally with \`npm run supabase:start\` and \`npm run db:reset\`, or point NEXT_PUBLIC_SUPABASE_URL at a hosted project.`;
  }
  if (cause instanceof Error && cause.message) return cause.message;
  return fallback;
}
