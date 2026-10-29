import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Topbar title={title} />
        <div className="shell py-8">{children}</div>
      </main>
    </div>
  );
}
