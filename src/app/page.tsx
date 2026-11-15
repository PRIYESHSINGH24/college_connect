import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code2, FolderKanban, Github, MessageCircle, Users, Check, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { CampusWordmark } from "@/components/brand/campus-mark";

export default async function LandingPage() {
  const { user } = await getCurrentUser();
  const destination = user ? "/home" : "/signup";
  return (
    <main className="min-h-screen overflow-hidden bg-canvas">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-7 lg:px-10">
        <Link href="/" aria-label="CampusLoop home"><CampusWordmark/></Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={user ? "/home" : "/login"} className="hidden rounded-xl px-3 py-2.5 text-xs font-bold text-ink transition hover:bg-white min-[380px]:inline-flex sm:px-4">{user ? "Open workspace" : "Sign in"}</Link>
          <Link href={destination} className="inline-flex items-center gap-2 rounded-xl bg-[#20231F] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#343A31] sm:px-4">{user ? "Go to feed" : "Join CampusLoop"}<ArrowUpRight size={15}/></Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-4 pb-16 pt-10 sm:px-7 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-muted">
            <span className="size-1.5 rounded-full bg-[#5555D9]"/> A network for people who build
          </div>
          <h1 className="mt-7 max-w-2xl text-[clamp(3.05rem,7vw,6rem)] font-black leading-[.91] tracking-[-.075em] text-[#20231F]">
            Your campus<br/>is full of <span className="relative inline-block text-[#5555D9]">possibility<span className="absolute -bottom-1 left-0 h-[5px] w-[86%] rounded-full bg-[#C7F36B] sm:h-[7px]"/></span>.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#686D68] sm:text-lg sm:leading-8">Meet the people behind the ideas. Share what you're making. Find your next teammate. CampusLoop turns the energy around you into things you can actually ship.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={destination} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#20231F] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#343A31]">Get into the loop <ArrowUpRight size={17}/></Link>
            <Link href="/login" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-[#C7C7BC]">I already belong <ArrowRight size={16}/></Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[11px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#277653]"/> College-first identity</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#277653]"/> Real project teams</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#277653]"/> Career-ready work</span>
          </div>
        </div>

        <div className="relative min-w-0 lg:pl-3">
          <div className="relative rounded-[26px] border border-[#deded6] bg-white p-3 shadow-[0_24px_80px_rgba(32,35,31,.09)] sm:rounded-[30px] sm:p-4">
            <div className="flex items-center justify-between border-b border-line px-2 pb-3 pt-1 sm:px-3">
              <div className="flex items-center gap-2"><CampusWordmark compact/><span className="text-xs font-extrabold tracking-tight">campus feed</span></div>
              <span className="rounded-full bg-[#F0F0E9] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-muted">A sample moment</span>
            </div>
            <div className="grid gap-3 p-2 pt-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:p-3 sm:pt-5">
              <div className="min-w-0 space-y-3">
                <article className="rounded-2xl border border-line p-4 sm:p-5">
                  <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-full bg-[#E6E8FA] text-[10px] font-black text-[#4141B8]">AS</span><div className="min-w-0"><p className="text-xs font-extrabold">Aarav Sharma</p><p className="text-[10px] text-muted">Computer Science · 2h ago</p></div><span className="ml-auto rounded-md bg-[#EFF5DF] px-2 py-1 text-[9px] font-extrabold text-[#506A2B]">BUILD LOG</span></div>
                  <h2 className="mt-4 text-lg font-black leading-6 tracking-tight sm:text-xl">A tiny idea turned into a team of four.</h2>
                  <p className="mt-2 text-xs leading-5 text-muted sm:text-sm sm:leading-6">We started a campus project board last month. Today we shipped our first working version and opened two contributor spots.</p>
                  <div className="mt-4 overflow-hidden rounded-xl bg-[#20231F] p-4 text-white sm:p-5">
                    <div className="flex items-center justify-between"><span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#C7F36B]">OPEN SOURCE PROJECT</span><ArrowUpRight size={15} className="text-[#C7F36B]"/></div>
                    <p className="mt-4 text-2xl font-black tracking-tight">Quadboard<span className="text-[#C7F36B]">.</span></p>
                    <p className="mt-1 text-[10px] text-white/55">Plan · Pair · Ship</p>
                    <div className="mt-4 flex flex-wrap gap-1.5"><span className="rounded bg-white/10 px-2 py-1 text-[9px]">Next.js</span><span className="rounded bg-white/10 px-2 py-1 text-[9px]">Postgres</span><span className="rounded bg-white/10 px-2 py-1 text-[9px]">Realtime</span></div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-muted"><span className="inline-flex items-center gap-1"><MessageCircle size={13}/> 18 replies</span><span className="inline-flex items-center gap-1"><Users size={13}/> 4 builders</span></div>
                </article>
                <div className="rounded-2xl bg-[#ECECFC] p-4 sm:p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#4141B8]">THE CAMPUS CONNECTION</span><Sparkles size={15} className="text-[#5555D9]"/></div><p className="mt-2 text-lg font-black leading-6 tracking-tight text-[#29295E]">Good work travels further when people find each other.</p></div>
              </div>
              <aside className="hidden space-y-3 sm:block">
                <div className="rounded-2xl bg-[#F7F7F2] p-3"><p className="text-[9px] font-extrabold uppercase tracking-widest text-muted">Find your crew</p><div className="mt-3 space-y-3">{[{n:"Neha K.",r:"Frontend · React",c:"#E5EAF7"},{n:"Aditya M.",r:"Backend · Node",c:"#EAF0DF"},{n:"Riya P.",r:"AI · Python",c:"#F2E9E1"}].map((person)=><div key={person.n} className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full text-[9px] font-black text-ink" style={{background:person.c}}>{person.n.split(" ").map((s)=>s[0]).join("")}</span><span className="min-w-0"><span className="block text-[10px] font-extrabold">{person.n}</span><span className="block truncate text-[9px] text-muted">{person.r}</span></span></div>)}</div></div>
                <div className="rounded-2xl border border-line p-3"><FolderKanban size={18} className="text-brand"/><p className="mt-3 text-xs font-extrabold">Project marketplace</p><p className="mt-1 text-[10px] leading-4 text-muted">Ideas looking for their next teammate.</p></div>
                <div className="rounded-2xl bg-[#C7F36B] p-3"><Code2 size={18}/><p className="mt-3 text-xs font-extrabold">Proof of work</p><p className="mt-1 text-[10px] leading-4 text-[#3D4B26]">Make your campus work part of your story.</p></div>
              </aside>
            </div>
            <div className="flex items-center justify-between border-t border-line px-3 pt-3 sm:px-4"><span className="text-[9px] font-bold text-muted">DESIGNED FOR REAL STUDENT COMMUNITIES</span><span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-brand"><Github size={12}/> BUILD IN PUBLIC</span></div>
          </div>
          <div className="absolute -bottom-5 -left-2 hidden rounded-xl border border-line bg-white px-4 py-3 shadow-lg md:flex md:items-center md:gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#C7F36B]"><Users size={16}/></span><span><span className="block text-xs font-extrabold">Find your people.</span><span className="block text-[10px] text-muted">Make something matter.</span></span></div>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-7 md:grid-cols-3 md:gap-10 md:py-16 lg:px-10">
          <div><Users size={21} className="text-brand"/><h3 className="mt-4 text-lg font-black tracking-tight">People before profiles.</h3><p className="mt-2 text-sm leading-6 text-muted">Discover students by what they know, what they care about, and what they want to make.</p></div>
          <div><FolderKanban size={21} className="text-brand"/><h3 className="mt-4 text-lg font-black tracking-tight">Ideas into shipped work.</h3><p className="mt-2 text-sm leading-6 text-muted">Find collaborators, create project teams, track tasks, and make your progress visible.</p></div>
          <div><Code2 size={21} className="text-brand"/><h3 className="mt-4 text-lg font-black tracking-tight">Your work tells your story.</h3><p className="mt-2 text-sm leading-6 text-muted">Connect GitHub, curate a portfolio, and turn real work into role-specific resumes.</p></div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-7 text-[11px] text-muted sm:px-7 lg:px-10"><CampusWordmark/><span>CampusLoop · Built for the people who make campus interesting.</span></footer>
    </main>
  );
}
