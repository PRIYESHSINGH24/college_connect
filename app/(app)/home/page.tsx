import Link from "next/link";
import { Heart, MessageCircle, Plus, Repeat2 } from "lucide-react";

const posts = [
  { name: "Aarav Mehta", handle: "@aaravm", body: "Our campus shuttle tracker is now open source. Looking for someone interested in data visualization to help with the next sprint.", tags: ["Open source", "React"], time: "38m", likes: 24 },
  { name: "Nisha Rao", handle: "@nishar", body: "Small reminder: the best portfolio project is one that solves a real problem for someone you can talk to.", tags: ["Build in public"], time: "2h", likes: 61 }
];

export default function HomePage() {
  return <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section>
      <div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Your network</p><h2 className="mt-1 text-3xl font-bold tracking-tight">The campus feed</h2></div><Link href="/projects/new" className="button-primary"><Plus size={17} className="mr-2" /> Post an update</Link></div>
      <div className="space-y-4">{posts.map((post) => <article key={post.handle} className="surface p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-sm font-bold">{post.name.split(" ").map((n) => n[0]).join("")}</div><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-3"><div><span className="font-semibold">{post.name}</span><span className="ml-2 text-sm text-muted">{post.handle}</span></div><span className="text-xs text-muted">{post.time}</span></div><p className="mt-3 text-[15px] leading-7">{post.body}</p><div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">#{tag}</span>)}</div><div className="mt-5 flex gap-6 text-sm text-muted"><button className="flex items-center gap-2 hover:text-brand"><Heart size={16} /> {post.likes}</button><button className="flex items-center gap-2 hover:text-brand"><MessageCircle size={16} /> Reply</button><button className="flex items-center gap-2 hover:text-brand"><Repeat2 size={16} /> Repost</button></div></div></div></article>)}</div>
    </section>
    <aside className="space-y-4">
      <div className="surface p-5"><p className="eyebrow">Your week</p><h3 className="mt-2 text-xl font-bold">Keep the momentum</h3><div className="mt-5 space-y-4">{[["Profile strength", "72%", "bg-brand"], ["Projects shared", "3", "bg-lime"], ["New connections", "8", "bg-quiet"]].map(([label, value, color]) => <div key={label}><div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}</span></div><div className="mt-2 h-2 rounded-full bg-quiet"><div className={`h-2 rounded-full ${color}`} style={{ width: value === "72%" ? "72%" : value === "3" ? "45%" : "62%" }} /></div></div>)}</div><Link href="/profile/edit" className="mt-5 block text-sm font-semibold text-brand">Complete your profile →</Link></div>
      <div className="surface p-5"><p className="eyebrow">Suggested for you</p><div className="mt-4 space-y-4">{["Rhea Kapoor", "Dev Patel", "Sana Khan"].map((name, i) => <div key={name} className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{name.split(" ").map((n) => n[0]).join("")}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted">{["Backend · CSE", "Product · ECE", "ML · CSE"][i]}</p></div><button className="text-xs font-semibold text-brand">Follow</button></div>)}</div></div>
    </aside>
  </div>;
}
