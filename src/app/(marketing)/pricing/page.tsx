import type { Metadata } from "next";
import { LeakCalculator } from "@/components/marketing/leak-calculator";
import { CtaBand, FaqSection, PricingSection } from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free. PactPop Pro costs less than one unbilled hour a month. Annual plans get 2 months free.",
};

export default function PricingPage() {
  return (
    <>
      <PricingSection showMatrix />
      <LeakCalculator />
      <FaqSection />
      <CtaBand />
    </>
  );
}
