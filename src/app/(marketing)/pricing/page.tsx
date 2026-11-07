import type { Metadata } from "next";
import { CtaBand, FaqSection, PricingSection } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <PricingSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
