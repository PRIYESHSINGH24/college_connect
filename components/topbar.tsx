import { Bell, Search } from "lucide-react";
import Link from "next/link";

export function Topbar({ title = "Good morning" }: { title?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 lg:px-10">
      <div>
        <p className="eyebrow">CampusLoop / 2026</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-ink"><Search size={18} /></Link>
        <Link href="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-ink"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" /></Link>
        <Link href="/profile/edit" className="grid h-10 w-10 place-items-center rounded-full bg-lime text-sm font-bold">PS</Link>
      </div>
    </header>
  );
}
