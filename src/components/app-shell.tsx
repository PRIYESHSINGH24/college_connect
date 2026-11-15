"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home, Compass, FolderKanban, MessageCircle, FileText, BriefcaseBusiness,
  CalendarDays, Users, Bell, Settings, LogOut, Search, Bookmark, Plus,
  ChevronDown, X, MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn, initials } from "@/lib/utils";
import { CampusWordmark } from "@/components/brand/campus-mark";

const primaryNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Discover people", icon: Compass },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-network", label: "My network", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];
const workspaceNav = [
  { href: "/bookmarks", label: "Saved posts", icon: Bookmark },
  { href: "/resume", label: "Resume studio", icon: FileText },
  { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
];
const mobileNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/projects", label: "Build", icon: FolderKanban },
  { href: "/messages", label: "Inbox", icon: MessageCircle },
  { href: "/resume", label: "Resume", icon: FileText },
];
const moreNav = [
  { href: "/my-network", label: "My network", icon: Users },
  { href: "/bookmarks", label: "Saved posts", icon: Bookmark },
  { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, profile }: {
  children: React.ReactNode;
  profile: { username: string; full_name: string; avatar_url?: string | null };
}) {
  const path = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) => href === "/home" ? path === href : path === href || path.startsWith(`${href}/`);

  return (
    <div className="app-frame min-h-screen bg-canvas">
      <header className="app-topbar sticky top-0 z-40 border-b border-line/90 bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/home" aria-label="CampusLoop home" className="shrink-0">
            <CampusWordmark />
          </Link>
          <Link href="/explore" className="top-search ml-5 hidden min-w-0 max-w-[520px] flex-1 items-center gap-3 rounded-xl border border-line bg-white/80 px-3.5 py-2.5 text-sm text-muted transition hover:border-[#B9B9EA] hover:bg-white md:flex">
            <Search size={16} />
            <span>Search people, projects, skills...</span>
            <kbd className="ml-auto rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-semibold">⌘ K</kbd>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/projects/new" className="hidden items-center gap-2 rounded-xl bg-[#20231F] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#343A31] sm:inline-flex">
              <Plus size={15} /> New project
            </Link>
            <Link href="/notifications" aria-label="Notifications" className={cn("relative rounded-xl p-2.5 transition hover:bg-white", isActive("/notifications") ? "text-brand" : "text-muted")}>
              <Bell size={19} />
              <span className="notification-pip" />
            </Link>
            <Link href={`/u/${profile.username}`} className="group flex items-center gap-2 rounded-full border border-transparent p-1 transition hover:border-line hover:bg-white">
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#DDE1FA] text-[11px] font-extrabold text-[#343A83]">
                {profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={32} height={32} unoptimized className="size-full object-cover" /> : initials(profile.full_name)}
              </span>
              <span className="hidden max-w-28 truncate text-xs font-bold text-ink sm:block">{profile.full_name}</span>
              <ChevronDown size={14} className="hidden text-muted sm:block" />
            </Link>
          </div>
        </div>
      </header>

      <div className="app-layout mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <aside className="desktop-rail hidden lg:block">
          <div className="sticky top-[92px] flex max-h-[calc(100vh-112px)] flex-col">
            <p className="nav-kicker">YOUR CAMPUS</p>
            <nav aria-label="Primary navigation" className="mt-2 space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                    className={cn("nav-link group", active && "nav-link-active")}>
                    <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                    <span>{item.label}</span>
                    {item.href === "/messages" && <span className="ml-auto rounded-full bg-[#ECECFC] px-1.5 py-0.5 text-[10px] font-extrabold text-brand">INBOX</span>}
                  </Link>
                );
              })}
            </nav>
            <p className="nav-kicker mt-8">YOUR WORKSPACE</p>
            <nav aria-label="Workspace navigation" className="mt-2 space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("nav-link", active && "nav-link-active")}><Icon size={18} strokeWidth={active ? 2.3 : 1.8} /><span>{item.label}</span></Link>;
              })}
            </nav>
            <div className="mt-auto pt-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#20231F] p-4 text-white">
                <div className="absolute -right-7 -top-7 size-24 rounded-full border border-white/10" />
                <div className="absolute -right-3 -top-3 size-16 rounded-full border border-white/10" />
                <p className="relative text-[10px] font-extrabold uppercase tracking-[.16em] text-[#C7F36B]">Make it happen</p>
                <p className="relative mt-2 text-[17px] font-black leading-5 tracking-tight">Small campus.<br />Big things.</p>
                <p className="relative mt-2 text-xs leading-5 text-white/60">Your next collaborator is one conversation away.</p>
                <Link href="/projects/new" className="relative mt-4 inline-flex items-center gap-2 rounded-lg bg-[#C7F36B] px-3 py-2 text-xs font-extrabold text-[#20231F] transition hover:bg-[#D6FF81]">Start building <Plus size={14} /></Link>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <Link href="/settings" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink"><Settings size={15} /> Settings</Link>
                <button onClick={signOut} disabled={signingOut} className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"><LogOut size={15} /> {signingOut ? "Leaving..." : "Sign out"}</button>
              </div>
            </div>
          </div>
        </aside>

        <main className="app-main min-w-0">{children}</main>
      </div>

      <nav aria-label="Mobile navigation" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 backdrop-blur-xl lg:hidden">
        {moreOpen && <div className="absolute inset-x-3 bottom-[calc(100%+10px)] rounded-2xl border border-line bg-white p-2 shadow-[0_18px_55px_rgba(24,27,23,.16)]">
          <div className="flex items-center justify-between px-2 pb-2 pt-1"><span className="text-xs font-extrabold uppercase tracking-widest text-muted">More from CampusLoop</span><button aria-label="Close menu" onClick={() => setMoreOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-canvas"><X size={16}/></button></div>
          <div className="grid grid-cols-2 gap-1">
            {moreNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={cn("flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold", isActive(item.href) ? "bg-[#ECECFC] text-brand" : "text-ink hover:bg-canvas")}><Icon size={16}/>{item.label}</Link>; })}
          </div>
          <button onClick={signOut} disabled={signingOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-red-700 hover:bg-red-50"><LogOut size={16}/>{signingOut ? "Signing out..." : "Sign out"}</button>
        </div>}
        <div className="mx-auto grid max-w-lg grid-cols-6 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-2">
          {mobileNav.map((item) => { const Icon = item.icon; const active = isActive(item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("mobile-nav-item", active && "mobile-nav-item-active")}><Icon size={19} strokeWidth={active ? 2.4 : 1.8}/><span>{item.label}</span></Link>; })}
          <button onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} className={cn("mobile-nav-item", moreOpen && "mobile-nav-item-active")}><MoreHorizontal size={20}/><span>More</span></button>
        </div>
      </nav>
    </div>
  );
}
