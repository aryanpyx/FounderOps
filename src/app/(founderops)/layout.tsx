import "@xyflow/react/dist/style.css";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import Sidebar from "@/components/Sidebar";

export default async function FounderOpsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Gate the whole FounderOps product behind auth.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // The agent/memory endpoints are scoped to a ComposioClawInstance. A brand-new
  // user has none yet — send them through onboarding (at /dashboard) to create it
  // and connect their tools before they land in the product.
  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instance) redirect("/dashboard");

  return (
    <div className="dark bg-background text-foreground flex min-h-screen flex-row">
      <Sidebar />
      <main className="grid-bg relative flex h-screen flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
