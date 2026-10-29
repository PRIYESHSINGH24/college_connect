import { CalendarClock, MapPin } from "lucide-react";

const opportunities = [
  { title: "Frontend Engineering Intern", org: "Northstar Labs", type: "Internship", location: "Remote", deadline: "Nov 18, 2026" },
  { title: "Campus Build Weekend", org: "Tech Society", type: "Hackathon", location: "On campus", deadline: "Nov 24, 2026" },
  { title: "Student Research Fellowship", org: "Applied AI Lab", type: "Research", location: "Hybrid", deadline: "Dec 02, 2026" }
];

export default function OpportunitiesPage() {
  return <div><p className="eyebrow">Career and community</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Opportunities with context</h2><p className="mt-2 text-muted">Curated places to learn, contribute, and get your next break.</p><div className="mt-8 space-y-3">{opportunities.map((item) => <article key={item.title} className="surface flex flex-col gap-5 p-5 md:flex-row md:items-center"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime text-sm font-bold">{item.org.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{item.type}</span></div><p className="mt-1 text-sm text-muted">{item.org}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted"><span className="flex items-center gap-1"><MapPin size={14} /> {item.location}</span><span className="flex items-center gap-1"><CalendarClock size={14} /> Apply by {item.deadline}</span></div></div><button className="button-secondary shrink-0">Save opportunity</button></article>)}</div></div>;
}
