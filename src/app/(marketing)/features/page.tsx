import type { Metadata } from "next";
import { AgentsSection, CtaBand, IntelligenceSection, PayPalSection, SecuritySection } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <h1 className="text-4xl font-semibold sm:text-5xl">Everything between “yes” and “paid”.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">AI agents, commitment intelligence and PayPal payments, connected on one record per client engagement.</p>
      </div>
      <AgentsSection />
      <IntelligenceSection />
      <PayPalSection />
      <SecuritySection />
      <CtaBand />
    </>
  );
}
