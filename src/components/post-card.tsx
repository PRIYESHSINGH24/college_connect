"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Globe2, Users, Loader2, Send } from "lucide-react";
import { formatDate, initials } from "@/lib/utils";

export type PostCardData = {
  id: string;
  author_id: string;
  body: string;
  visibility: string;
  created_at: string;
  author?: { username: string; full_name: string; avatar_url?: string | null } | null;
  likes?: number;
  comments?: number;
  liked?: boolean;
  bookmarked?: boolean;
};
type Comment = { id: string; author_id: string; body: string; created_at: string; author?: { username: string; full_name: string } | null };

export function PostCard({ post }: { post: PostCardData }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [count, setCount] = useState(post.likes || 0);
  const [bookmarked, setBookmarked] = useState(!!post.bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  async function toggleLike() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: liked ? "DELETE" : "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Like failed");
      setLiked(!liked); setCount((value) => value + (liked ? -1 : 1));
    } catch (error) { setError(error instanceof Error ? error.message : "Action failed"); }
    finally { setBusy(false); }
  }

  async function toggleBookmark() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, { method: bookmarked ? "DELETE" : "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Bookmark failed");
      setBookmarked(!bookmarked);
    } catch (error) { setError(error instanceof Error ? error.message : "Action failed"); }
    finally { setBusy(false); }
  }

  async function openComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      try {
        const response = await fetch(`/api/posts/${post.id}/comments`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load comments");
        setComments(data.comments || []);
      } catch (error) { setError(error instanceof Error ? error.message : "Could not load comments"); }
    }
  }

  async function sendComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentBody.trim() || commentBusy) return;
    setCommentBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: commentBody }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Comment failed");
      setComments((current) => [{ id: data.id, author_id: "me", body: commentBody, created_at: new Date().toISOString() }, ...current]);
      setCommentBody("");
    } catch (error) { setError(error instanceof Error ? error.message : "Comment failed"); }
    finally { setCommentBusy(false); }
  }

  const author = post.author;
  const VisibilityIcon = post.visibility === "public" ? Globe2 : Users;

  return (
    <article className="feed-card min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <Link href={`/u/${author?.username || "unknown"}`} aria-label={`View ${author?.full_name || "campus member"}'s profile`} className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#E6E8FA] text-[11px] font-extrabold text-[#4141B8] ring-2 ring-white">
          {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={40} height={40} unoptimized className="size-full object-cover"/> : initials(author?.full_name)}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-x-1.5 gap-y-1">
            <Link href={`/u/${author?.username || "unknown"}`} className="max-w-[55%] truncate text-[13px] font-extrabold tracking-tight hover:text-brand">{author?.full_name || "Campus member"}</Link>
            <span className="truncate text-[11px] text-muted">@{author?.username || "member"}</span>
            <span className="text-[11px] text-muted">·</span>
            <time className="shrink-0 text-[11px] text-muted" dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            <div className="relative ml-auto shrink-0">
              <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Post options" aria-expanded={menuOpen} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"><MoreHorizontal size={17}/></button>
              {menuOpen && <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-line bg-white p-1.5 shadow-xl"><button type="button" onClick={() => { void toggleBookmark(); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-canvas">{bookmarked ? "Remove saved post" : "Save post"}</button><button type="button" onClick={() => setMenuOpen(false)} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-muted hover:bg-canvas">Close</button></div>}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-muted"><VisibilityIcon size={11}/>{post.visibility === "public" ? "Public post" : post.visibility === "followers" ? "Followers" : "Campus community"}</div>
          <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-[1.75] text-[#373C35] sm:text-sm">{post.body}</p>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button type="button" onClick={toggleLike} disabled={busy} aria-pressed={liked} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition hover:bg-[#FFF1F1] ${liked ? "text-[#B94040]" : "text-muted hover:text-[#B94040]"}`}><Heart size={16} fill={liked ? "currentColor" : "none"}/><span>{count}</span></button>
              <button type="button" onClick={openComments} aria-expanded={showComments} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-muted transition hover:bg-[#F0F0FD] hover:text-brand"><MessageCircle size={16}/><span>{post.comments || comments.length}</span></button>
            </div>
            <button type="button" onClick={toggleBookmark} disabled={busy} aria-pressed={bookmarked} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition hover:bg-[#F0F0FD] ${bookmarked ? "text-brand" : "text-muted hover:text-brand"}`}><Bookmark size={16} fill={bookmarked ? "currentColor" : "none"}/><span className="hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span></button>
          </div>
          {showComments && <div className="mt-3 border-t border-line pt-3">
            <div className="space-y-2">{comments.map((comment) => <div key={comment.id} className="rounded-xl bg-canvas p-3"><p className="text-[11px] font-extrabold">{comment.author?.full_name || "You"} <span className="font-normal text-muted">· {formatDate(comment.created_at)}</span></p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5">{comment.body}</p></div>)}</div>
            <form onSubmit={sendComment} className="mt-3 flex min-w-0 gap-2"><input className="field min-w-0 flex-1" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Add to the conversation..." maxLength={2000}/><button type="submit" aria-label="Send comment" className="btn-primary shrink-0 !px-3" disabled={commentBusy || !commentBody.trim()}>{commentBusy ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}</button></form>
          </div>}
          {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}
