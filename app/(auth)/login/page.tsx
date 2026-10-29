import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <div className="w-full max-w-md"><Link href="/" className="mb-12 block text-lg font-bold lg:hidden">CampusLoop</Link><p className="eyebrow text-brand">Welcome back</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Log in to your campus</h1><p className="mt-3 text-sm leading-6 text-muted">Use the email connected to your student identity.</p><LoginForm /><p className="mt-6 text-center text-sm text-muted">New here? <Link href="/signup" className="font-semibold text-brand">Create an account</Link></p></div>;
}
