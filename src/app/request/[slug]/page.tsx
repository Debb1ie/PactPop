import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { businesses } from "@/server/db/schema";
import { RequestForm } from "./request-form";

async function business(slug: string) {
  const db = await getDb();
  const [b] = await db.select({ name: businesses.name, isDemo: businesses.isDemo }).from(businesses).where(eq(businesses.slug, slug)).limit(1);
  return b ?? null;
}

export async function generateMetadata({ params }: PageProps<"/request/[slug]">): Promise<Metadata> {
  const b = await business((await params).slug);
  return { title: b ? `Request a project from ${b.name}` : "Request link" };
}

/** Public client request form behind each business's request link. */
export default async function RequestPage({ params }: PageProps<"/request/[slug]">) {
  const { slug } = await params;
  const b = await business(slug);
  if (!b) notFound();

  return (
    <div className="force-light min-h-screen bg-[radial-gradient(60rem_30rem_at_10%_-10%,#ece6ff,transparent_60%),radial-gradient(50rem_30rem_at_100%_0%,#ffe9d8,transparent_60%)] bg-background text-foreground">
      <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <p className="text-center font-[family-name:var(--font-brand)] text-[1rem] font-semibold uppercase tracking-[0.06em] text-[#0d0d10]/70">PactPop</p>
        <div className="mt-8 text-center">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#6c4ef5]">Project request</p>
          <h1 className="mt-2 text-balance text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.5rem]">Tell {b.name} what you need</h1>
          <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">
            Describe your project in your own words. You&apos;ll get a clear proposal with scope, price and milestones to review before anything is agreed.
          </p>
          {b.isDemo && <p className="mt-3 text-[0.75rem] text-muted">Demo workspace: requests here are sample data.</p>}
        </div>
        <div className="pure mt-8 rounded-[1.75rem] p-6 sm:p-8">
          <RequestForm slug={slug} businessName={b.name} />
        </div>
      </div>
    </div>
  );
}
