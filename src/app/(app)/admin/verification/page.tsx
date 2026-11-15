import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { VerificationReview } from "@/components/verification-review";

type PendingMembership = { id: string; user_id: string; created_at: string };
type StudentProfile = { id: string; full_name: string; username: string };

export default async function VerificationAdminPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) {
    return <div className="surface p-6 text-sm text-muted">No verified organization is linked to your account.</div>;
  }

  const { data: role } = await supabase.from("organization_memberships")
    .select("role,status").eq("user_id", user.id).eq("organization_id", profile.organization_id).maybeSingle();
  if (!role || role.status !== "verified" || !["college_admin", "super_admin"].includes(role.role)) {
    return <div className="surface p-6 text-sm text-muted">You do not have permission to review verification requests.</div>;
  }

  const { data, error } = await supabase.from("organization_memberships")
    .select("id,user_id,created_at").eq("organization_id", profile.organization_id)
    .eq("status", "pending").order("created_at").limit(100);
  const pending = (data || []) as PendingMembership[];
  const userIds = [...new Set(pending.map(row => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id,full_name,username").in("id", userIds)
    : { data: [] as StudentProfile[] };
  const profileMap = new Map(((profiles || []) as StudentProfile[]).map(student => [student.id, student]));

  return <div className="mx-auto max-w-4xl">
    <PageHeader eyebrow="ADMINISTRATION" title="College verification" description="Approve student accounts only after validating their institutional identity." />
    {error ? <div className="surface p-5 text-sm text-red-600">{error.message}</div> : pending.length ?
      <div className="surface divide-y divide-line">
        {pending.map(row => {
          const student = profileMap.get(row.user_id);
          return <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-bold">{student?.full_name || "Student"}</p>
              <p className="text-xs text-muted">@{student?.username || "unknown"} · Requested {new Date(row.created_at).toLocaleDateString()}</p>
            </div>
            <VerificationReview id={row.id} />
          </div>;
        })}
      </div> : <div className="surface p-8 text-center text-sm text-muted">No pending verification requests.</div>}
  </div>;
}
