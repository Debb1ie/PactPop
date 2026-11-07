import { LeakCalculator } from "@/components/marketing/leak-calculator";
import { ProductTour } from "@/components/marketing/product-tour";
import {
  AgentsSection,
  AudienceSection,
  ComparisonSection,
  CtaBand,
  FaqSection,
  Hero,
  IntelligenceSection,
  PayPalSection,
  PricingSection,
  Problem,
  SecuritySection,
} from "@/components/marketing/sections";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <LeakCalculator />
      <ProductTour />
      <IntelligenceSection />
      <AgentsSection />
      <ComparisonSection />
      <AudienceSection />
      <PayPalSection />
      <SecuritySection />
      <PricingSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
