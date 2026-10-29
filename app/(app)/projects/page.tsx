import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

const projects = [
  { title: "Campus Shuttle Tracker", owner: "Aarav Mehta", summary: "Real-time routes and accessibility-first alerts for students commuting across campus.", tech: ["Next.js", "Postgres"], roles: 2, state: "Open to collaborators" },
  { title: "StudyShelf", owner: "Rhea Kapoor", summary: "A peer-powered library for notes, explainers, and exam prep paths.", tech: ["React", "Supabase"], roles: 1, state: "Building" },
  { title: "GreenScore", owner: "Dev Patel", summary: "Make everyday campus sustainability visible, measurable, and social.", tech: ["Python", "Data"], roles: 3, state: "Idea stage" }
];

export default function ProjectsPage() {
  return <div><div className="mb-8 flex items-end justify-between"><div><p className="eyebrow">Collaboration marketplace</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Find something worth building</h2><p className="mt-2 text-muted">Projects are spaces for ideas, teammates, and visible progress.</p></div><Link href="/projects/new" className="button-primary"><Plus size={17} className="mr-2" /> New project</Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <article key={project.title} className="surface flex flex-col p-5"><div className="flex items-start justify-between"><span className="rounded-full bg-lime px-2.5 py-1 text-xs font-semibold">{project.state}</span><button aria-label={`Open ${project.title}`} className="text-muted"><ArrowUpRight size={18} /></button></div><h3 className="mt-6 text-xl font-bold">{project.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{project.summary}</p><p className="mt-5 text-xs text-muted">Started by <span className="font-semibold text-ink">{project.owner}</span></p><div className="mt-4 flex flex-wrap gap-2">{project.tech.map((tag) => <span key={tag} className="rounded-lg bg-quiet px-2 py-1 text-xs font-medium">{tag}</span>)}</div><div className="mt-5 border-t border-line pt-4 text-sm font-semibold text-brand">{project.roles} open teammate {project.roles === 1 ? "role" : "roles"} →</div></article>)}</div></div>;
}
