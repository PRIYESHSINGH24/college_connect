export function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
export function formatDate(value: string | Date) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
export function initials(name?: string | null) { return (name || "Student").split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase(); }
