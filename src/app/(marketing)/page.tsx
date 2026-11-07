import { AgentsSection, CtaBand, FaqSection, Hero, HowItWorks, IntelligenceSection, PayPalSection, PricingSection, Problem, SecuritySection } from "@/components/marketing/sections";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <AgentsSection />
      <IntelligenceSection />
      <PayPalSection />
      <SecuritySection />
      <PricingSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
