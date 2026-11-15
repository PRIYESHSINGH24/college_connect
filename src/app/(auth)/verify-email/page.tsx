import Link from "next/link";
export default function VerifyEmailPage() {
  return <div className="mx-auto max-w-md"><Link href="/" className="text-sm font-bold text-brand">CampusLoop</Link><div className="surface mt-6 p-6 text-center sm:p-8"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#ECECFC] text-brand">@</div><h1 className="mt-4 text-2xl font-black">Check your inbox</h1><p className="mt-2 text-sm leading-6 text-muted">Open the confirmation link sent by Supabase to verify your email. Once confirmed, sign in to continue onboarding.</p><Link href="/login" className="btn-primary mt-6 inline-flex">Back to sign in</Link></div></div>;
}
