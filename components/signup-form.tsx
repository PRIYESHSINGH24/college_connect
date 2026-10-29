"use client";

import { useState } from "react";

export function SignupForm() {
  const [message, setMessage] = useState("");
  return <form className="mt-8 space-y-4" onSubmit={(event) => { event.preventDefault(); setMessage("Account creation needs a configured Supabase project. Your form is ready for server-side validation."); }}>
    <label className="block text-sm font-medium">Full name<input required className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="Your name" /></label>
    <label className="block text-sm font-medium">Username<input required pattern="[a-zA-Z0-9_]{3,24}" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="your_handle" /></label>
    <label className="block text-sm font-medium">College email<input required type="email" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="you@college.edu" /></label>
    <label className="block text-sm font-medium">Password<input required minLength={8} type="password" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="At least 8 characters" /></label>
    <button className="button-primary w-full">Create account</button>
    {message && <p role="status" className="rounded-xl bg-quiet p-3 text-sm text-muted">{message}</p>}
  </form>;
}
