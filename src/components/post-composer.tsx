"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Globe2, Users } from "lucide-react";

export function PostComposer() {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("campus");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim(), visibility }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Post failed");
      setBody("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not publish your post.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="feed-card overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[13px] font-extrabold tracking-tight">Put something into the world.</p><p className="mt-0.5 text-[11px] text-muted">A question, a small win, a work-in-progress.</p></div>
        <span className="hidden rounded-lg bg-[#EFF5DF] px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#526B2D] sm:inline-flex">Build in public</span>
      </div>
      <textarea
        className="mt-3 min-h-[86px] w-full resize-y rounded-xl border border-transparent bg-[#F7F7F2] px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-[#92978E] focus:border-[#BFC0E9] focus:bg-white focus:ring-2 focus:ring-brand/10"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={5000}
        placeholder="What's taking shape in your corner of campus?"
        required
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted"><span className="sr-only">Post visibility</span>{visibility === "public" ? <Globe2 size={14}/> : <Users size={14}/>}<select aria-label="Post visibility" className="max-w-[130px] rounded-lg border-0 bg-transparent py-1 text-[11px] font-bold text-ink outline-none" value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="campus">Campus community</option><option value="public">Public</option><option value="followers">Followers</option></select></label>
          <span className="text-[10px] tabular-nums text-muted">{body.length.toLocaleString()}/5,000</span>
        </div>
        <button type="submit" className="btn-primary" disabled={busy || !body.trim()}>{busy ? "Publishing..." : "Share update"}<ArrowUpRight size={15}/></button>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
    </form>
  );
}
