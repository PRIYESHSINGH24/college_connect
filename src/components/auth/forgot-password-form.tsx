"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { authErrorMessage } from "@/lib/supabase/auth-error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If an account exists for this email, a password-reset link has been sent.");
    } catch (cause) {
      setError(authErrorMessage(cause, "Could not request a reset link."));
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="block"><span className="mb-1.5 block text-sm font-semibold">College email</span><input className="field" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@college.edu" /></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
    <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
    <p className="text-center text-sm text-muted"><Link className="font-bold text-brand" href="/login">Back to sign in</Link></p>
  </form>;
}
