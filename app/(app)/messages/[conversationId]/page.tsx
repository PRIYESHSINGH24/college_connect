import Link from "next/link";
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <div className="surface mx-auto max-w-3xl p-6"><Link href="/messages" className="text-sm font-semibold text-brand">← Messages</Link><p className="mt-8 text-sm text-muted">Conversation {conversationId}</p><h2 className="mt-1 text-2xl font-bold">Private conversation</h2><p className="mt-3 text-muted">Messages will be persisted before realtime delivery once Supabase is configured.</p><div className="mt-8 rounded-xl bg-quiet p-4 text-sm text-muted">This conversation is intentionally empty until an authenticated participant opens it.</div></div>;
}
