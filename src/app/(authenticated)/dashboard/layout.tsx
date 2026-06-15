import { ErrorBoundary } from "~/components/core/error-boundary";
import { TooltipProvider } from "~/components/ui/tooltip";
import Sidebar from "~/founderops/components/Sidebar";

// The dashboard pages (Agent Chat, Toolkits, Settings) render inside the SAME
// FounderOps sidebar shell as the rest of the product — so navigating to them
// never drops the sidebar or surfaces the old TrustClaw navbar.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="dark bg-background text-foreground flex min-h-screen flex-row">
        <Sidebar />
        <main className="grid-bg relative flex h-screen min-h-0 flex-1 flex-col overflow-y-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </TooltipProvider>
  );
}
