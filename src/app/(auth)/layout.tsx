import Link from "next/link";
import { ArrowUpRight, Compass, Users } from "lucide-react";
import { CampusWordmark } from "@/components/brand/campus-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[.92fr_1.08fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#20231F] p-10 text-white sm:p-12 lg:flex xl:p-16">
        <div className="pointer-events-none absolute -right-40 top-20 size-[520px] rounded-full border border-white/[.08]"/>
        <div className="pointer-events-none absolute -right-24 top-36 size-[360px] rounded-full border border-white/[.08]"/>
        <div className="pointer-events-none absolute -right-2 top-[270px] size-28 rounded-full border border-[#C7F36B]/30"/>
        <Link href="/" className="relative z-10 inline-flex w-fit"><CampusWordmark inverse/></Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#C7F36B]">A place to find your people</p>
          <h1 className="mt-6 text-5xl font-black leading-[.98] tracking-[-.065em] xl:text-6xl">Good ideas<br/>don't build<br/><span className="text-[#C7F36B]">themselves.</span></h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/60">Meet the people around you who care about the same details. Start small, make useful things, and give your campus a little momentum.</p>
          <div className="mt-9 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold text-white/75"><Users size={13}/> Find collaborators</span><span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold text-white/75"><Compass size={13}/> Discover what's next</span></div>
        </div>
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-white/40"><span>CampusLoop · Student builder network</span><Link href="/" className="inline-flex items-center gap-1 hover:text-white">Back to home <ArrowUpRight size={12}/></Link></div>
      </section>
      <section className="flex min-w-0 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex lg:hidden"><CampusWordmark/></Link>
          <div className="rounded-[22px] border border-line bg-white p-5 shadow-[0_14px_45px_rgba(32,35,31,.045)] sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
          <p className="mt-6 text-center text-[10px] leading-5 text-muted">By continuing, you agree to keep CampusLoop useful, respectful, and student-first.</p>
        </div>
      </section>
    </main>
  );
}
