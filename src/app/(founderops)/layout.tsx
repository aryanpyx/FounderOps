import "@xyflow/react/dist/style.css";
import Sidebar from "@/components/Sidebar";

export default function FounderOpsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark bg-background text-foreground flex min-h-screen flex-row">
      <Sidebar />
      <main className="grid-bg relative flex h-screen flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
