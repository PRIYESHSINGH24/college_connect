import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
export default function ForgotPasswordPage() {
  return <div className="mx-auto max-w-md"><Link href="/" className="text-sm font-bold text-brand">CampusLoop</Link><div className="surface mt-6 p-6 sm:p-8"><p className="eyebrow">ACCOUNT RECOVERY</p><h1 className="mt-2 text-2xl font-black">Reset your password</h1><p className="mt-2 mb-6 text-sm leading-6 text-muted">We will send a recovery link to the email associated with your account.</p><ForgotPasswordForm /></div></div>;
}
