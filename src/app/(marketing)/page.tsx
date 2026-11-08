import { CardWallSection } from "@/components/marketing/card-wall";
import { MeetPoppy } from "@/components/marketing/meet-poppy";
import { LeakCalculator } from "@/components/marketing/leak-calculator";
import { ProductTour } from "@/components/marketing/product-tour";
import {
  AgentsSection,
  ArchitectureSection,
  AudienceSection,
  ComparisonSection,
  CtaBand,
  FaqSection,
  Hero,
  PreviewSection,
  IntelligenceSection,
  PayPalSection,
  Problem,
  SecuritySection,
} from "@/components/marketing/sections";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <PreviewSection />
      <CardWallSection />
      <MeetPoppy />
      <Problem />
      <LeakCalculator />
      <ProductTour />
      <ArchitectureSection />
      <IntelligenceSection />
      <AgentsSection />
      <ComparisonSection />
      <AudienceSection />
      <PayPalSection />
      <SecuritySection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
