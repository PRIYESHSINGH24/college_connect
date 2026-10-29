import Link from "next/link";
import { ArrowRight, Code2, MessageCircle, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <nav className="shell flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span> CampusLoop</Link>
        <div className="flex items-center gap-3"><Link href="/login" className="button-secondary">Log in</Link><Link href="/signup" className="button-primary">Join your campus</Link></div>
      </nav>
      <section className="shell grid min-h-[72vh] items-center gap-14 py-16 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="eyebrow text-brand">Your campus, connected</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[1.04] tracking-[-0.05em] md:text-7xl">Make your next big project a team sport.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">CampusLoop brings student identity, developer projects, conversations, opportunities, and career proof into one trusted community.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="button-primary">Create your profile <ArrowRight size={17} className="ml-2" /></Link><Link href="/explore" className="button-secondary">See the community</Link></div>
          <p className="mt-5 text-xs text-muted">Built for college communities · Privacy-first · Developer-friendly</p>
        </div>
        <div className="surface relative overflow-hidden p-6 md:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/70 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between"><span className="eyebrow">Campus pulse</span><span className="rounded-full bg-lime px-2.5 py-1 text-xs font-semibold">Live</span></div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight">What are you building?</h2>
            <div className="mt-7 space-y-3">
              {[["AR Lab", "Looking for a frontend teammate for our accessibility toolkit.", "2h"], ["Maya Shah", "Just shipped an open-source timetable parser.", "4h"], ["Design Club", "Portfolio review night · Thursday 6:30 PM", "1d"]].map(([name, text, time]) => <div key={name} className="rounded-xl border border-line bg-canvas p-4"><div className="flex justify-between text-xs text-muted"><span className="font-semibold text-ink">{name}</span><span>{time}</span></div><p className="mt-2 text-sm leading-6">{text}</p></div>)}
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 text-center">{[[Users, "Peers"], [Code2, "Projects"], [MessageCircle, "Conversations"]].map(([Icon, label]) => <div key={label as string} className="rounded-xl bg-brand-soft p-3"><Icon size={18} className="mx-auto text-brand" /><p className="mt-1 text-xs font-semibold">{label as string}</p></div>)}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
