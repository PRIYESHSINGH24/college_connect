import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return <div className="w-full max-w-md"><Link href="/" className="mb-12 block text-lg font-bold lg:hidden">CampusLoop</Link><p className="eyebrow text-brand">Join your campus</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Create your student profile</h1><p className="mt-3 text-sm leading-6 text-muted">Start with your college email. You can complete the rest of your profile later.</p><SignupForm /><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand">Log in</Link></p></div>;
}
