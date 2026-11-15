import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export default function ResetPasswordPage() {
  return <div className="mx-auto max-w-md"><Link href="/" className="text-sm font-bold text-brand">CampusLoop</Link><div className="surface mt-6 p-6 sm:p-8"><p className="eyebrow">ACCOUNT RECOVERY</p><h1 className="mt-2 text-2xl font-black">Choose a new password</h1><p className="mt-2 mb-6 text-sm leading-6 text-muted">Use at least eight characters. This form requires a valid recovery session.</p><ResetPasswordForm /></div></div>;
}
