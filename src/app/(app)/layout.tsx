import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const {supabase,user}=await requireUser();const {data:profile}=await supabase.from("profiles").select("username,full_name,avatar_url").eq("id",user.id).maybeSingle();return <AppShell profile={{username:profile?.username||"student",full_name:profile?.full_name||user.email||"Student",avatar_url:profile?.avatar_url}}>{children}</AppShell>}
