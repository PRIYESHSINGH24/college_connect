"use client";

import { useState } from "react";

export function LoginForm() {
  const [message, setMessage] = useState("");
  return <form className="mt-8 space-y-4" onSubmit={(event) => { event.preventDefault(); setMessage("Authentication is not configured yet. Add Supabase credentials to enable sign-in."); }}>
    <label className="block text-sm font-medium">Email<input required type="email" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none ring-brand focus:ring-2" placeholder="you@college.edu" /></label>
    <label className="block text-sm font-medium">Password<input required type="password" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none ring-brand focus:ring-2" placeholder="••••••••" /></label>
    <div className="flex justify-end"><a href="/forgot-password" className="text-sm font-semibold text-brand">Forgot password?</a></div>
    <button className="button-primary w-full">Log in</button>
    {message && <p role="status" className="rounded-xl bg-quiet p-3 text-sm text-muted">{message}</p>}
  </form>;
}
