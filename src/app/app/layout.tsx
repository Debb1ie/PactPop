import { and, eq, sql } from "drizzle-orm";
import { AppShell } from "@/components/app/shell";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { approvals } from "@/server/db/schema";
import { aiConfigured, paypalConfigured } from "@/server/env";
import { PLANS } from "@/lib/plans";
import { logoutAction } from "../(auth)/actions";

function planBadge(planId: string, trialEndsAt: Date | null) {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null;
  return { name: plan.name, paid: plan.monthlyMinor > 0, trialDaysLeft };
}

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
      plan={planBadge(ctx.business.plan, ctx.business.trialEndsAt)}
      pendingApprovals={n}
      logout={logoutAction}
      integrations={{ paypal: paypalConfigured(), ai: aiConfigured() }}
    >
      {children}
    </AppShell>
  );
}
