import Link from "next/link";

export function PagePlaceholder({ eyebrow, title, description, actionHref, actionLabel }: { eyebrow: string; title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <div className="surface max-w-2xl p-8 md:p-12"><p className="eyebrow text-brand">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{title}</h2><p className="mt-3 max-w-xl leading-7 text-muted">{description}</p>{actionHref && actionLabel && <Link href={actionHref} className="button-primary mt-7">{actionLabel}</Link>}</div>;
}
