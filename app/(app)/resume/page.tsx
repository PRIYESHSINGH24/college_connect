import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default function ResumePage() {
  return <div className="max-w-5xl"><div className="flex items-end justify-between"><div><p className="eyebrow">Career toolkit</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Your resumes</h2><p className="mt-2 text-muted">Keep focused versions for the opportunities you care about.</p></div><Link href="/resume/new" className="button-primary"><Plus size={17} className="mr-2" /> New resume</Link></div><div className="mt-8 grid gap-4 md:grid-cols-3">{["Software engineering · 2026", "Product internships", "Academic research"].map((name, i) => <article key={name} className="surface p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><FileText size={20} /></div><h3 className="mt-5 font-bold">{name}</h3><p className="mt-2 text-sm text-muted">Last edited {i + 1} day{i ? "s" : ""} ago</p><Link href={`/resume/${i + 1}/edit`} className="mt-6 block text-sm font-semibold text-brand">Open editor →</Link></article>)}</div></div>;
}
