import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]"><section className="hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="text-lg font-bold">CampusLoop</Link><div><p className="eyebrow text-white/70">A better campus network</p><h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight tracking-[-0.04em]">Your people, your projects, your proof.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/75">A trusted place for students to discover collaborators and turn ideas into work they can be proud of.</p></div><p className="text-sm text-white/60">One campus at a time.</p></section><section className="flex items-center justify-center p-6">{children}</section></main>;
}
