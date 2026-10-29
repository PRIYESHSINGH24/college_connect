import Link from "next/link";
import { navigation, utilityNavigation } from "@/lib/navigation";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-canvas px-5 py-7 lg:flex">
      <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-bold tracking-tight">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
        CampusLoop
      </Link>
      <nav className="space-y-1">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-quiet hover:text-ink">
            <Icon size={18} strokeWidth={1.8} /> {label}
          </Link>
        ))}
      </nav>
      <div className="my-7 border-t border-line" />
      <nav className="space-y-1">
        {utilityNavigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-quiet hover:text-ink">
            <Icon size={18} strokeWidth={1.8} /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-brand-soft p-4">
        <p className="text-sm font-semibold">Build something useful.</p>
        <p className="mt-1 text-xs leading-5 text-muted">Find peers, ship projects, and make your work visible.</p>
        <Link href="/projects/new" className="mt-4 inline-block text-xs font-bold text-brand">Start a project →</Link>
      </div>
    </aside>
  );
}
