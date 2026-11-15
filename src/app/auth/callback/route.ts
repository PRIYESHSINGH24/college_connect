import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") || "/home";
  // Only allow same-origin relative paths to avoid an open redirect in auth callbacks.
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/home";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
