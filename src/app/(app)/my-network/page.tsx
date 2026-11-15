import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Users, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { FollowButton } from "@/components/follow-button";
import { initials } from "@/lib/utils";

export default async function MyNetworkPage() {
  const { supabase, user } = await requireUser();
  const [followingResult, followersResult] = await Promise.all([
    supabase.from("follows").select("following_id,created_at").eq("follower_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("follows").select("follower_id,created_at").eq("following_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const followingIds = (followingResult.data || []).map((row) => row.following_id);
  const followerIds = (followersResult.data || []).map((row) => row.follower_id);
  const allIds = [...new Set([...followingIds, ...followerIds])];
  const { data: profiles, error } = allIds.length
    ? await supabase.from("profiles").select("id,username,full_name,headline,department,skills,avatar_url").in("id", allIds)
    : { data: [], error: null };
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const followingSet = new Set(followingIds);
  const followers = followerIds.map((id) => profileMap.get(id)).filter(Boolean);
  const following = followingIds.map((id) => profileMap.get(id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="YOUR PEOPLE" title="My network" description="Keep up with the people you follow and the students following your work."/>
      {error || followingResult.error || followersResult.error ? <div className="surface p-5 text-sm text-red-600">Could not load your network. Please refresh and try again.</div> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface min-w-0 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-line pb-4"><div className="flex items-center gap-2"><UserRoundCheck size={18} className="text-brand"/><h2 className="font-extrabold">Following</h2></div><span className="rounded-full bg-[#ECECFC] px-2.5 py-1 text-xs font-extrabold text-brand">{following.length}</span></div>
            {following.length ? <div className="divide-y divide-line">{following.map((person) => person && <div key={person.id} className="flex min-w-0 items-center gap-3 py-3"><Link href={`/u/${person.username}`} className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ECECFC] text-xs font-extrabold text-brand">{person.avatar_url ? <Image src={person.avatar_url} alt="" width={40} height={40} unoptimized className="size-full object-cover"/> : initials(person.full_name)}</Link><div className="min-w-0 flex-1"><Link href={`/u/${person.username}`} className="block truncate text-sm font-extrabold hover:text-brand">{person.full_name}</Link><p className="truncate text-xs text-muted">{person.headline || person.department || `@${person.username}`}</p></div><FollowButton userId={person.id} initiallyFollowing={followingSet.has(person.id)}/></div>)}</div> : <div className="py-12 text-center"><UserRoundPlus size={24} className="mx-auto text-muted"/><p className="mt-3 text-sm font-extrabold">Your network starts here.</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted">Find students working on interesting things and follow their journey.</p><Link href="/explore" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-brand">Discover students <ArrowUpRight size={13}/></Link></div>}
          </section>
          <section className="surface min-w-0 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-line pb-4"><div className="flex items-center gap-2"><Users size={18} className="text-brand"/><h2 className="font-extrabold">Followers</h2></div><span className="rounded-full bg-[#F0F1EA] px-2.5 py-1 text-xs font-extrabold text-ink">{followers.length}</span></div>
            {followers.length ? <div className="divide-y divide-line">{followers.map((person) => person && <div key={person.id} className="flex min-w-0 items-center gap-3 py-3"><Link href={`/u/${person.username}`} className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ECECFC] text-xs font-extrabold text-brand">{person.avatar_url ? <Image src={person.avatar_url} alt="" width={40} height={40} unoptimized className="size-full object-cover"/> : initials(person.full_name)}</Link><div className="min-w-0 flex-1"><Link href={`/u/${person.username}`} className="block truncate text-sm font-extrabold hover:text-brand">{person.full_name}</Link><p className="truncate text-xs text-muted">{person.headline || person.department || `@${person.username}`}</p></div><FollowButton userId={person.id} initiallyFollowing={followingSet.has(person.id)}/></div>)}</div> : <div className="py-12 text-center"><Users size={24} className="mx-auto text-muted"/><p className="mt-3 text-sm font-extrabold">No followers just yet.</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted">Share what you are building. The right people will find you.</p></div>}
          </section>
        </div>
      )}
    </div>
  );
}
