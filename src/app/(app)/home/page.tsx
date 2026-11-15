import Link from "next/link";
import { ArrowUpRight, ArrowRight, CalendarDays, FolderKanban, MessageCircle, Plus, Users, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PostComposer } from "@/components/post-composer";
import { PostCard, type PostCardData } from "@/components/post-card";
import { initials } from "@/lib/utils";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

export default async function HomePage() {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();
  const [profileResult, postsResult, projectsResult, peopleResult, eventsResult, opportunitiesResult] = await Promise.all([
    supabase.from("profiles").select("id,username,full_name,headline,department,skills,avatar_url,graduation_year,bio").eq("id", user.id).maybeSingle(),
    supabase.from("posts").select("id,author_id,body,visibility,created_at,like_count,comment_count").order("created_at", { ascending: false }).limit(20),
    supabase.from("projects").select("id,title,description,tech_stack,openings,accepted_count,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(3),
    supabase.from("profiles").select("id,username,full_name,headline,department,skills,avatar_url").neq("id", user.id).eq("profile_visibility", "public").order("created_at", { ascending: false }).limit(4),
    supabase.from("events").select("id,title,location,starts_at").eq("status", "published").gte("starts_at", now).order("starts_at", { ascending: true }).limit(2),
    supabase.from("opportunities").select("id,title,category,deadline,location").eq("status", "published").or(`deadline.is.null,deadline.gte.${now}`).order("created_at", { ascending: false }).limit(2),
  ]);

  const profile = profileResult.data;
  const rows = postsResult.data || [];
  const postIds = rows.map((post) => post.id);
  const authorIds = [...new Set(rows.map((post) => post.author_id))];
  const [authorsResult, likedResult, savedResult] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", authorIds) : Promise.resolve({ data: [] as { id: string; username: string; full_name: string; avatar_url: string | null }[] }),
    postIds.length ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length ? supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const authorMap = new Map((authorsResult.data || []).map((author) => [author.id, author]));
  const liked = new Set((likedResult.data || []).map((item) => item.post_id));
  const saved = new Set((savedResult.data || []).map((item) => item.post_id));
  const posts: PostCardData[] = rows.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    body: post.body,
    visibility: post.visibility,
    created_at: post.created_at,
    author: authorMap.get(post.author_id) || null,
    likes: post.like_count || 0,
    comments: post.comment_count || 0,
    liked: liked.has(post.id),
    bookmarked: saved.has(post.id),
  }));

  const projects = projectsResult.data || [];
  const people = peopleResult.data || [];
  const events = eventsResult.data || [];
  const opportunities = opportunitiesResult.data || [];
  const profileChecks = [profile?.full_name, profile?.headline, profile?.department, profile?.bio, profile?.skills?.length, profile?.graduation_year];
  const profileProgress = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const displayName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="home-grid mx-auto grid min-w-0 max-w-[1240px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_292px] xl:gap-7">
      <section className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="home-kicker">Your campus, in motion</p>
            <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.7rem)] font-black leading-[1.02] tracking-[-.065em] text-ink">Good things start<br className="hidden sm:block"/> <span className="text-brand">with a connection.</span></h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Hey, {displayName}. See what people are making, find your next teammate, and keep your momentum going.</p>
          </div>
          <Link href="/projects/new" className="btn-primary shrink-0"><Plus size={16}/> Start a project</Link>
        </div>

        <div className="relative mb-5 overflow-hidden rounded-[21px] bg-[#20231F] px-5 py-5 text-white sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-20 size-60 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 -top-9 size-40 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#C7F36B]"><span className="size-1.5 rounded-full bg-[#C7F36B]"/> The builder's corner</span>
              <h2 className="mt-3 max-w-md text-[clamp(1.35rem,3vw,2rem)] font-black leading-[1.05] tracking-[-.05em]">Don't just scroll campus.<br/><span className="text-[#C7F36B]">Move it forward.</span></h2>
              <p className="mt-3 max-w-md text-xs leading-5 text-white/65 sm:text-sm">Show the messy middle, find people who care about the details, and ship something together.</p>
            </div>
            <Link href="/explore" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[#C7F36B] px-4 py-3 text-xs font-extrabold text-[#20231F] transition hover:bg-[#D8FF8D]">Find your people <ArrowUpRight size={15}/></Link>
          </div>
        </div>

        <div className="mb-5">
          <PostComposer />
        </div>

        <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="home-kicker">The campus conversation</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Fresh from your network</h2>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">Explore all <ArrowRight size={14}/></Link>
        </div>

        {postsResult.error ? (
          <div className="surface p-5 text-sm text-red-600">Could not load the feed: {postsResult.error.message}</div>
        ) : posts.length ? (
          <div className="space-y-3">{posts.map((post) => <PostCard key={post.id} post={post}/>)}</div>
        ) : (
          <div className="surface px-6 py-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#ECECFC] text-brand"><MessageCircle size={22}/></div>
            <h3 className="mt-4 font-extrabold">A fresh page for your campus.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">No posts yet. Share what you are learning, building, or looking for. Your first post can start a collaboration.</p>
          </div>
        )}
      </section>

      <aside className="hidden min-w-0 space-y-4 xl:block">
        <section className="right-rail-card">
          <div className="flex items-center justify-between">
            <p className="home-kicker">Your profile</p>
            <Link href="/settings" aria-label="Edit profile" className="text-xs font-bold text-brand hover:underline">Edit</Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#20231F] text-xs font-extrabold text-[#C7F36B]">{initials(profile?.full_name)}</div>
            <div className="min-w-0"><p className="truncate text-sm font-extrabold">{profile?.full_name || "Campus member"}</p><p className="truncate text-[11px] text-muted">{profile?.headline || profile?.department || "Add a headline"}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold">Profile strength</span><span className="text-xs font-extrabold text-brand">{profileProgress}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFEFE8]"><div className="h-full rounded-full bg-brand" style={{ width: `${profileProgress}%` }}/></div>
          <p className="mt-3 text-[11px] leading-5 text-muted">A complete profile helps teammates understand what you bring.</p>
        </section>

        <section className="right-rail-card">
          <div className="flex items-center justify-between"><div><p className="home-kicker">Open collaboration</p><h2 className="mt-1 text-base font-black">Projects to explore</h2></div><FolderKanban size={18} className="text-brand"/></div>
          {projects.length ? <div className="mt-3 divide-y divide-line">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="block py-3 first:pt-0 last:pb-0 group"><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold leading-5 group-hover:text-brand">{project.title}</p><ArrowUpRight size={14} className="shrink-0 text-muted"/></div><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{project.description}</p><div className="mt-2 flex flex-wrap gap-1">{(project.tech_stack || []).slice(0, 3).map((tech: string) => <span key={tech} className="rounded-md bg-[#F1F1EC] px-1.5 py-1 text-[9px] font-bold text-[#555B52]">{tech}</span>)}</div></Link>)}</div> : <p className="mt-3 text-xs leading-5 text-muted">No open projects have been published yet. Start one and invite your campus in.</p>}
          <Link href="/projects" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">Browse marketplace <ArrowRight size={13}/></Link>
        </section>

        <section className="right-rail-card">
          <div className="flex items-center justify-between"><div><p className="home-kicker">People worth meeting</p><h2 className="mt-1 text-base font-black">Fresh faces</h2></div><Users size={18} className="text-brand"/></div>
          {people.length ? <div className="mt-3 space-y-3">{people.map((person) => <Link href={`/u/${person.username}`} key={person.id} className="flex items-center gap-2.5 group"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ECECFC] text-[10px] font-extrabold text-brand">{initials(person.full_name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold group-hover:text-brand">{person.full_name}</span><span className="block truncate text-[10px] text-muted">{person.headline || person.department || "Campus member"}</span></span><ArrowUpRight size={13} className="text-muted"/></Link>)}</div> : <p className="mt-3 text-xs leading-5 text-muted">New public profiles will show up here when students join.</p>}
          <Link href="/explore" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">Discover students <ArrowRight size={13}/></Link>
        </section>

        <section className="right-rail-card">
          <div className="flex items-center justify-between"><div><p className="home-kicker">On the horizon</p><h2 className="mt-1 text-base font-black">Campus calendar</h2></div><CalendarDays size={18} className="text-brand"/></div>
          {events.length ? <div className="mt-3 space-y-3">{events.map((event) => <Link key={event.id} href="/events" className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ECECFC] text-center"><span className="text-[9px] font-extrabold uppercase text-brand">{new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(event.starts_at))}</span><span className="text-sm font-black leading-3 text-[#30307C]">{new Date(event.starts_at).getDate()}</span></span><span className="min-w-0"><span className="block text-xs font-extrabold leading-5">{event.title}</span><span className="block truncate text-[10px] text-muted">{event.location || "Campus event"}</span></span></Link>)}</div> : <p className="mt-3 text-xs leading-5 text-muted">No upcoming events are listed. Check back as clubs publish their calendars.</p>}
          <Link href="/events" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">See all events <ArrowRight size={13}/></Link>
        </section>

        <section className="right-rail-card">
          <div className="flex items-center justify-between"><div><p className="home-kicker">Career signals</p><h2 className="mt-1 text-base font-black">Opportunities</h2></div><Zap size={18} className="text-brand"/></div>
          {opportunities.length ? <div className="mt-3 space-y-3">{opportunities.map((item) => <Link href="/opportunities" key={item.id} className="block"><p className="text-xs font-extrabold leading-5 hover:text-brand">{item.title}</p><p className="mt-1 text-[10px] capitalize text-muted">{item.category.replaceAll("_", " ")}{item.location ? ` · ${item.location}` : ""}</p>{item.deadline && <p className="mt-1 text-[10px] font-semibold text-[#8A631C]">Deadline {dateLabel(item.deadline)}</p>}</Link>)}</div> : <p className="mt-3 text-xs leading-5 text-muted">No opportunities posted yet. Keep an eye on the campus board.</p>}
          <Link href="/opportunities" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">Explore opportunities <ArrowRight size={13}/></Link>
        </section>

        <div className="px-2 pt-1 text-[10px] leading-5 text-muted">CampusLoop · Built for the people who make campus interesting.</div>
      </aside>
    </div>
  );
}
