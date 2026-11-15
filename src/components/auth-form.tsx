"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { authErrorMessage } from "@/lib/supabase/auth-error";
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState(""); const [username,setUsername]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState(""); const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setNotice("");try{const supabase=createClient();if(mode==="signup"){const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,username},emailRedirectTo:`${window.location.origin}/auth/callback`}});if(error)throw error;setNotice("Account created successfully. You can sign in now.");}else{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;router.replace("/home");router.refresh();}}catch(err){setError(authErrorMessage(err,"Something went wrong."));}finally{setBusy(false);}}
  return <form onSubmit={submit} className="space-y-4">
    {mode==="signup"&&<><label className="block"><span className="mb-1.5 block text-sm font-semibold">Full name</span><input className="field" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={80} placeholder="Alex Morgan"/></label><label className="block"><span className="mb-1.5 block text-sm font-semibold">Username</span><input className="field" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" placeholder="alexmorgan"/><span className="mt-1 block text-xs text-muted">3–24 letters, numbers, or underscores.</span></label></>}
    <label className="block"><span className="mb-1.5 block text-sm font-semibold">College email</span><input className="field" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@college.edu"/></label>
    <label className="block"><span className="mb-1.5 block text-sm font-semibold">Password</span><input className="field" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters"/></label>
    {error&&<p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
    <button disabled={busy} className="btn-primary w-full">{busy?"Please wait...":mode==="login"?"Sign in":"Create account"}</button>
    {mode==="login"&&<p className="text-right text-xs"><Link className="font-semibold text-brand" href="/forgot-password">Forgot password?</Link></p>}
    <p className="text-center text-sm text-muted">{mode==="login"?"New to CampusLoop? ":"Already have an account? "}<Link className="font-bold text-brand" href={mode==="login"?"/signup":"/login"}>{mode==="login"?"Create an account":"Sign in"}</Link></p>
  </form>;
}
