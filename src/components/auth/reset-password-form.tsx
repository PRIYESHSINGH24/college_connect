"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { authErrorMessage } from "@/lib/supabase/auth-error";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/home"); router.refresh();
    } catch (cause) {
      setError(authErrorMessage(cause, "Could not update password."));
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="block"><span className="mb-1.5 block text-sm font-semibold">New password</span><input className="field" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
    <label className="block"><span className="mb-1.5 block text-sm font-semibold">Confirm password</span><input className="field" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <button className="btn-primary w-full" disabled={busy}>{busy ? "Updating..." : "Update password"}</button>
  </form>;
}
