"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplyToProject({ projectId, existingApplicationId, existingStatus }: { projectId: string; existingApplicationId: string | null; existingStatus: string | null }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/apply`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Application failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Application failed.");
    } finally { setBusy(false); }
  }

  async function withdraw() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/project-applications/${existingApplicationId}/withdraw`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not withdraw the application.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not withdraw the application.");
    } finally { setBusy(false); }
  }

  if (existingStatus) {
    return <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#F3F3EF] p-4 text-sm">
      <span>You've already applied: <strong>{existingStatus}</strong></span>
      {existingStatus === "pending" && existingApplicationId && <button type="button" onClick={withdraw} disabled={busy} className="text-xs font-bold text-brand">{busy ? "Working..." : "Withdraw"}</button>}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>;
  }

  return <form onSubmit={submit} className="mt-5">
    <h3 className="font-bold">Apply to join</h3>
    <textarea className="field mt-2" rows={3} minLength={10} maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Tell the project owner how you can contribute..." required />
    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    <button className="btn-primary mt-3" disabled={busy || !message.trim()}>{busy ? "Submitting..." : "Send application"}</button>
  </form>;
}
