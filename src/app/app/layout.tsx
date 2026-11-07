import { and, eq, sql } from "drizzle-orm";
import { AppShell } from "@/components/app/shell";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { approvals } from "@/server/db/schema";
import { aiConfigured, paypalConfigured } from "@/server/env";
import { logoutAction } from "../(auth)/actions";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const ctx = await requireAuth();
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(approvals)
    .where(and(eq(approvals.businessId, ctx.business.id), eq(approvals.status, "pending")));
  return (
    <AppShell
      user={ctx.user}
      business={ctx.business}
      pendingApprovals={n}
      logout={logoutAction}
      integrations={{ paypal: paypalConfigured(), ai: aiConfigured() }}
    >
      {children}
    </AppShell>
  );
}
